import { DynamoDB } from "@aws-sdk/client-dynamodb";
import { marshall, unmarshall } from "@aws-sdk/util-dynamodb";
import { WebClient } from "@slack/web-api";
import {
  formatJSONResponse,
  ValidatedEventAPIGatewayProxyEvent,
} from "@libs/api-gateway";
import dayjs from "dayjs";
import { TABLES } from "src/constants";

const {
  AWS_REGION,
  SLACK_CHANNEL_ID,
  SLACK_BOT_TOKEN,
  JIRA_KANBAN_NAME,
  JIRA_KANBAN_URL,
} = process.env;
const client = new DynamoDB({ region: AWS_REGION });

const run: ValidatedEventAPIGatewayProxyEvent<any> = async (_event) => {
  if (
    !SLACK_CHANNEL_ID ||
    !SLACK_BOT_TOKEN ||
    !JIRA_KANBAN_NAME ||
    !JIRA_KANBAN_URL
  ) {
    return formatJSONResponse(500, {
      message: "Internal Server Error",
    });
  }

  const slackWeb = new WebClient(SLACK_BOT_TOKEN);

  try {
    const { Items } = await client.scan({ TableName: TABLES.USER });

    if (!Items || Items.length < 3) {
      return formatJSONResponse(204, {
        message:
          "Not enough members for rotation. it should be at least 3 members",
      });
    }

    const sortedMembers = Items.map((item) => unmarshall(item)).sort((a, b) =>
      a.last_host.localeCompare(b.last_host)
    );

    const [todayHost, nextHost] = sortedMembers;
    const todayHostNewHostDate = dayjs().toISOString();
    // const todayHostNewHostDateDifference =
    //   dayjs(nextHost.last_host).unix() - dayjs(todayHost.last_host).unix();
    // const todayHostNewHostDateWhenSkipped = dayjs(nextHost.last_host)
    //   .subtract(todayHostNewHostDateDifference / 2, "milliseconds")
    //   .toISOString();
    const { ok } = await slackWeb.chat.postMessage({
      channel: SLACK_CHANNEL_ID,
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
          type: "divider",
        },
        {
          type: "section",
          text: {
            type: "mrkdwn",
            text: `오늘의 데일리 스탠드업 진행자는 <@${todayHost.id}>님입니다.`,
          },
        },
        {
          type: "section",
          text: {
            type: "mrkdwn",
            text: `*진행자 역할*\n- <${JIRA_KANBAN_URL}|${JIRA_KANBAN_NAME}> 화면 공유\n- 스탠드업 진행`,
          },
        },
        {
          type: "divider",
        },
        {
          type: "context",
          elements: [
            {
              type: "mrkdwn",
              text: `다음 스탠드업 진행자: \`${nextHost.real_name}\` 님`,
            },
          ],
        },
        {
          type: "divider",
        },
        {
          type: "actions",
          elements: [
            {
              type: "button",
              text: {
                type: "plain_text",
                text: "진행자 건너뛰기",
                emoji: true,
              },
              value: JSON.stringify({
                type: "skip_host",
                payload: {
                  todayHost,
                  todayHostNewHostDate,
                  // todayHostNewHostDateWhenSkipped,
                },
              }),
            },
          ],
        },
      ],
    });

    console.log("Webhook Success: ", ok);

    const { $metadata } = await client.updateItem({
      TableName: TABLES.USER,
      Key: marshall({
        id: todayHost.id,
      }),
      UpdateExpression: "SET #last_host = :last_host_value",
      ExpressionAttributeNames: {
        "#last_host": "last_host",
      },
      ExpressionAttributeValues: marshall({
        ":last_host_value": todayHostNewHostDate,
      }),
    });

    console.log($metadata);

    return formatJSONResponse(200, {
      sorted: sortedMembers,
      todayHost,
      nextHost,
    });
  } catch (e) {
    console.log(e);

    return formatJSONResponse(500, {
      message: "Internal Server Error",
    });
  }
};

export const main = run;
