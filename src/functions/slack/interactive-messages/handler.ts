import { DynamoDB } from "@aws-sdk/client-dynamodb";
import { marshall, unmarshall } from "@aws-sdk/util-dynamodb";
import {
  InvokeCommand,
  InvokeCommandInput,
  LambdaClient,
} from "@aws-sdk/client-lambda";
import {
  formatJSONResponse,
  ValidatedEventAPIGatewayProxyEvent,
} from "@libs/api-gateway";
import { WebClient } from "@slack/web-api";
import { TABLES } from "src/constants";

const {
  AWS_REGION,
  SERVICE_NAME,
  SLACK_BOT_TOKEN,
  GOOGLE_MEET_URL,
  JIRA_KANBAN_NAME,
  JIRA_KANBAN_URL,
} = process.env;

const lambdaClient = new LambdaClient({ region: AWS_REGION });
const client = new DynamoDB({ region: AWS_REGION });

const interactiveMessages: ValidatedEventAPIGatewayProxyEvent<any> = async (
  event
) => {
  const { body } = event;

  if (
    !SERVICE_NAME ||
    !SLACK_BOT_TOKEN ||
    !GOOGLE_MEET_URL ||
    !JIRA_KANBAN_NAME ||
    !JIRA_KANBAN_URL
  ) {
    return formatJSONResponse(500, {
      message: "Internal Server Error",
    });
  }

  const slackWeb = new WebClient(SLACK_BOT_TOKEN);

  if (typeof body !== "string") {
    return formatJSONResponse(400, {
      message: "Bad Request",
    });
  }

  const slackResponsePayload = body.split("=")[1];

  if (!slackResponsePayload) {
    return formatJSONResponse(400, {
      message: "Bad Request",
    });
  }

  try {
    const parsedResponsePayload = JSON.parse(
      decodeURIComponent(slackResponsePayload)
    );
    const { channel_id, message_ts } = parsedResponsePayload.container;
    const { type, payload } = JSON.parse(
      parsedResponsePayload.actions[0].value
    );
    // const { todayHost, todayHostNewHostDate, todayHostNewHostDateWhenSkipped } =
    const { todayHost, todayHostNewHostDate } = payload;

    switch (type) {
      case "skip_host": {
        const { Item } = await client.getItem({
          TableName: TABLES.USER,
          Key: marshall({
            id: todayHost.id,
          }),
        });

        if (!Item) {
          throw new Error("Not found user");
        }

        const host = unmarshall(Item);
        const currentTime = +new Date();
        const lastHostDate = new Date();
        const lastHostOneHourAdded = +new Date(lastHostDate).setHours(
          lastHostDate.getHours() + 1
        );

        if (
          host.last_host !== todayHostNewHostDate || // last_host가 변경된 경우
          currentTime > lastHostOneHourAdded // 요청 시각이 last_host +1시간보다 큰 경우
        ) {
          throw new Error("Expired action");
        }

        const invokeParams: InvokeCommandInput = {
          FunctionName: `${SERVICE_NAME}-dev-run`,
          InvocationType: "RequestResponse",
          LogType: "Tail",
        };

        const invokeCommand = new InvokeCommand(invokeParams);

        const [{ $metadata: lambda_$metadata }, threadDeleteResult] =
          await Promise.all([
            lambdaClient.send(invokeCommand),
            slackWeb.chat.update({
              channel: channel_id,
              ts: message_ts,
              blocks: [
                {
                  type: "header",
                  text: {
                    type: "plain_text",
                    text: ":loudspeaker: 데일리 스탠드업 진행자 공지",
                    emoji: true,
                  },
                },
                {
                  type: "section",
                  text: {
                    type: "mrkdwn",
                    text: "_건너뜀_",
                  },
                },
              ],
            }),
          ]);

        console.log("lambda_$metadata: ", lambda_$metadata);
        console.log("slack.chat.delete: ", threadDeleteResult);

        // TODO 건너뛴 진행자 다음날 진행자가 되도록 설정 -> 두 번 이상 건너뛰는 경우에 대한 예외처리..
        // const { $metadata } = await client.updateItem({
        //   TableName: TABLES.USER,
        //   Key: marshall({
        //     id: todayHost.id,
        //   }),
        //   UpdateExpression: "SET #last_host = :last_host_value",
        //   ExpressionAttributeNames: {
        //     "#last_host": "last_host",
        //   },
        //   ExpressionAttributeValues: marshall({
        //     ":last_host_value": todayHostNewHostDateWhenSkipped,
        //   }),
        // });

        // console.log($metadata);

        return formatJSONResponse(200, {
          run: lambda_$metadata,
          delete: threadDeleteResult,
        });
      }
      default:
        throw new Error("Unknown action type");
    }
  } catch (e: unknown) {
    if (e instanceof Error) {
      console.log(e.name);
      console.log(e.message);
    }

    return formatJSONResponse(500, {
      message: "Internal Server Error",
    });
  }
};

export const main = interactiveMessages;
