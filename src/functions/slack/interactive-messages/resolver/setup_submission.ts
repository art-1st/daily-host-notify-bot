import {
  DeleteRuleCommand,
  ListTargetsByRuleCommand,
  PutRuleCommand,
  PutTargetsCommand,
  RemoveTargetsCommand,
} from "@aws-sdk/client-cloudwatch-events";
import {
  AddPermissionCommand,
  GetFunctionCommand,
} from "@aws-sdk/client-lambda";
import { marshall, unmarshall } from "@aws-sdk/util-dynamodb";
import { formatJSONResponse } from "@libs/api-gateway";
import CommandError from "@libs/command-error";
import { generateSlackBlockMessageResponse } from "@libs/message";
import got from "got";
import {
  cloudwatchEventsClient,
  ddbClient,
  lambdaClient,
  slackWebClient,
} from "src/client";
import { TABLES } from "src/constants";

const { SERVICE_NAME } = process.env;

type SetupPayloadSubmission = {
  header: string;
  content: string;
  notification_time: string;
  googlemeet_link: string | null;
};

type SetupPayloadState = "modify" | "create";

export async function interactiveMessageSetupSubmissionResolver(_payload: any) {
  const payload =
    _payload as InteractiveMessageDialogSubmissionPayload<SetupPayloadSubmission>;
  const state = payload.state as SetupPayloadState;
  const time = payload.submission.notification_time;
  const [utc9hh, mm] = time.split(":");
  const hh = (Number(utc9hh) - 9).toString();
  const putRuleCommand = new PutRuleCommand({
    Name: `CloudWatchEventRule_${payload.channel.id}`,
    ScheduleExpression: `cron(${Number(mm)} ${hh} ? * 2-6 *)`,
    State: "ENABLED",
  });

  try {
    // 채널이 이미 존재하는 경우 정보 수정
    if (state === "modify") {
      // 채널 정보 가져오기
      const channelData = await ddbClient.getItem({
        TableName: TABLES.TABLE,
        Key: marshall({ channel_id: payload.channel.id }),
        AttributesToGet: ["event_rule_arn", "users"],
      });
      const channel = unmarshall(channelData.Item ?? {});
      const prevRuleArn = channel["event_rule_arn"] ?? "";
      const [, prevRuleName] = prevRuleArn.split("/");
      if (!prevRuleName) {
        throw new Error("NO PREVIOUS CLOUDWATCH EVENT ARN");
      }

      // 기존 이벤트 룰에서 타겟 Id 가져오기
      const listTargetByRuleResponse = await cloudwatchEventsClient.send(
        new ListTargetsByRuleCommand({
          Rule: prevRuleName,
        })
      );

      if (listTargetByRuleResponse.Targets?.length) {
        // 기존 이벤트 룰 Run 함수 타겟 삭제
        const deleteExistingRuleTargetResponse =
          await cloudwatchEventsClient.send(
            new RemoveTargetsCommand({
              Rule: prevRuleName,
              Ids: listTargetByRuleResponse.Targets.map((target) => target.Id!),
            })
          );
        console.info(
          "DELETE EVENT TARGET SUCCESS",
          deleteExistingRuleTargetResponse.$metadata
        );
      }

      // 기존 이벤트 룰 삭제
      const deleteExistingRuleResponse = await cloudwatchEventsClient.send(
        new DeleteRuleCommand({
          Name: prevRuleName,
        })
      );
      console.info(
        "DELETE EVENT ARN SUCCESS",
        deleteExistingRuleResponse.$metadata
      );
    }

    // 신규 이벤트 룰 생성
    const putRuleResponse = await cloudwatchEventsClient.send(putRuleCommand);
    console.info("ADD NEW RULE SUCCESS", putRuleResponse.$metadata);

    // Run 함수 ARN 가져오기
    const getRunFunctionResponse = await lambdaClient.send(
      new GetFunctionCommand({
        FunctionName: `${SERVICE_NAME}-dev-run`,
      })
    );
    console.info(
      "GET LAMBDA FUNCTION SUCCESS",
      getRunFunctionResponse.$metadata
    );
    const runFunctionArn = getRunFunctionResponse.Configuration?.FunctionArn;
    if (!runFunctionArn) {
      throw new Error("CANNOT GET RUN FUNCTION ARN");
    }

    // 이벤트 룰에 Lambda Invoke Permission 추가
    try {
      const addLambdaInvokePermissionResponse = await lambdaClient.send(
        new AddPermissionCommand({
          FunctionName: `${SERVICE_NAME}-dev-run`,
          StatementId: `Scheduled-Event-${payload.channel.id}`,
          Action: "lambda:InvokeFunction",
          Principal: "events.amazonaws.com",
          SourceArn: putRuleResponse.RuleArn,
        })
      );
      console.info(
        "ADD LAMBDA PERMISSION SUCCESS",
        addLambdaInvokePermissionResponse.$metadata,
        addLambdaInvokePermissionResponse.Statement
      );
    } catch (e) {
      console.warn("ADD LAMBDA PERMISSION FAILED");
    }

    // 신규 이벤트에 Run 함수 타겟 설정
    const putTargetsResponse = await cloudwatchEventsClient.send(
      new PutTargetsCommand({
        Rule: putRuleCommand.input.Name,
        Targets: [
          {
            Id: "CloudWatchEventTarget",
            Arn: runFunctionArn,
            Input: JSON.stringify({
              channel_id: payload.channel.id,
            }),
          },
        ],
      })
    );
    console.info("PUT TARGETS SUCCESS", putTargetsResponse.$metadata);

    // 채널 DB에 미팅 정보 적용
    const updateChannelResult = await ddbClient.updateItem({
      TableName: TABLES.TABLE,
      Key: marshall({
        channel_id: payload.channel.id,
      }),
      UpdateExpression:
        "SET #header = :header, #content = :content, #googlemeet_link = :googlemeet_link, #event_rule_arn = :event_rule_arn",
      ExpressionAttributeNames: {
        "#header": "message_header",
        "#content": "message_content",
        "#googlemeet_link": "googlemeet_link",
        "#event_rule_arn": "event_rule_arn",
      },
      ExpressionAttributeValues: marshall({
        ":header": payload.submission.header,
        ":content": payload.submission.content,
        ":googlemeet_link": payload.submission.googlemeet_link,
        ":event_rule_arn": putRuleResponse.RuleArn,
      }),
    });
    console.info("UPDATE CHANNEL SUCCESS", updateChannelResult.$metadata);

    await got.post(payload.response_url, {
      body: JSON.stringify({
        text: "채널의 미팅 구성이 성공적으로 완료되었습니다. 미팅 참여자를 설정해주세요. /user-add {MEMBER ID}",
      }),
    });

    return formatJSONResponse(200, "");
  } catch (e) {
    if (e instanceof CommandError) {
      return generateSlackBlockMessageResponse(200, {
        response_type: "ephemeral",
        blocks: [
          {
            type: "section",
            text: {
              type: "plain_text",
              text: e.message,
              emoji: true,
            },
          },
        ],
      });
    }

    console.error(e);
    return formatJSONResponse(500, {
      message: "Internal Server Error",
    });
  }
}
