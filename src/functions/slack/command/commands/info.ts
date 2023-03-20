import { marshall, unmarshall } from "@aws-sdk/util-dynamodb";
import { formatJSONResponse } from "@libs/api-gateway";
import CommandError, { CommandErrorName } from "@libs/command-error";
import { Channel } from "@libs/channel";
import { generateSlackBlockMessageResponse } from "@libs/message";
import dayjs from "dayjs";
import { parseExpression } from "cron-parser";
import { cloudwatchEventsClient, ddbClient, slackWebClient } from "src/client";
import { TABLES } from "src/constants";
import { CommandRequestPayload } from "src/types/command";
import { ChannelData } from "src/types/data";
import { DescribeRuleCommand } from "@aws-sdk/client-cloudwatch-events";
import { eventBridgeCronExpressionToHhMm } from "@libs/helpers";

export async function commandShowInfo(payload: CommandRequestPayload) {
  const { channel_id } = payload;

  try {
    const { Item } = await ddbClient.getItem({
      TableName: TABLES.TABLE,
      Key: marshall({ channel_id }),
    });

    let botIsChannelMember = false;

    try {
      const conversationResult = await slackWebClient.conversations.info({
        channel: channel_id,
      });

      botIsChannelMember = conversationResult.channel?.is_member ?? false;
    } catch (e) {
      console.error(e);
    }

    if (!Item) {
      return generateSlackBlockMessageResponse(200, {
        response_type: "ephemeral",
        blocks: [
          {
            type: "header",
            text: {
              type: "plain_text",
              text: "채널 정보",
              emoji: true,
            },
          },
          {
            type: "context",
            elements: [
              {
                type: "mrkdwn",
                text: botIsChannelMember
                  ? ":robot_face: :white_check_mark: 봇이 채널에 추가되어 있습니다."
                  : ":robot_face: :warning: 봇이 채널에 추가되어 있지 않습니다. 진행자 알림이 실행되지 않을 수 있습니다.",
              },
            ],
          },
          {
            type: "divider",
          },
          {
            type: "section",
            text: {
              type: "mrkdwn",
              text: ":question: 이 채널은 구성되어 있지 않아요. \n`/setup` 으로 설정후에 진행해주세요.",
            },
          },
        ],
      });
    }

    const channelData = unmarshall(Item) as ChannelData;
    const eventRuleArn = channelData.event_rule_arn;
    const { users } = new Channel(channelData);

    if (!eventRuleArn) {
      throw new CommandError(CommandErrorName.COMMON_RULE_ARN_BROKEN);
    }

    if (!users || !users.length) {
      throw new CommandError(CommandErrorName.COMMON_CHANNEL_NO_USERS);
    }

    const [, ruleName] = eventRuleArn.split("/");
    const { ScheduleExpression } = await cloudwatchEventsClient.send(
      new DescribeRuleCommand({
        Name: ruleName,
      })
    );

    if (!ScheduleExpression) {
      throw new CommandError(CommandErrorName.COMMON_RULE_ARN_BROKEN);
    }
    const { hh, mm } = eventBridgeCronExpressionToHhMm(ScheduleExpression);
    const membersText = users.map((user) => `<@${user}>`).join(" → ");

    return generateSlackBlockMessageResponse(200, {
      response_type: "ephemeral",
      blocks: [
        {
          type: "header",
          text: {
            type: "plain_text",
            text: "채널 정보",
            emoji: true,
          },
        },
        {
          type: "context",
          elements: [
            {
              type: "mrkdwn",
              text: botIsChannelMember
                ? ":robot_face: :white_check_mark: 봇이 채널에 추가되어 있습니다."
                : ":robot_face: :warning: 봇이 채널에 추가되어 있지 않습니다. 진행자 알림이 실행되지 않을 수 있습니다.",
            },
          ],
        },
        {
          type: "divider",
        },
        {
          type: "section",
          text: {
            type: "mrkdwn",
            text: ":calendar: *알림 시간*",
          },
        },
        {
          type: "section",
          text: {
            type: "mrkdwn",
            text: `매주 월-금 ${hh}:${mm}`,
          },
        },
        {
          type: "section",
          text: {
            type: "mrkdwn",
            text: `:bust_in_silhouette: *등록된 사용자* (${users.length}명)`,
          },
        },
        {
          type: "section",
          text: {
            type: "mrkdwn",
            text: membersText,
          },
        },
      ],
    });
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
