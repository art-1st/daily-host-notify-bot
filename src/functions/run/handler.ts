import { DynamoDB, UpdateItemCommand } from "@aws-sdk/client-dynamodb";
import { unmarshall } from "@aws-sdk/util-dynamodb";
import {
  formatJSONResponse,
  ValidatedEventAPIGatewayProxyEvent,
} from "@libs/api-gateway";
import dayjs from "dayjs";
import got from "got";
import { TABLES } from "src/constants";

const {
  AWS_REGION,
  SLACK_INCOMING_WEBHOOK_ENDPOINT,
  JIRA_KANBAN_NAME,
  JIRA_KANBAN_URL,
} = process.env;
const client = new DynamoDB({ region: AWS_REGION });

const run: ValidatedEventAPIGatewayProxyEvent<any> = async (_event) => {
  if (
    !SLACK_INCOMING_WEBHOOK_ENDPOINT ||
    !JIRA_KANBAN_NAME ||
    !JIRA_KANBAN_URL
  ) {
    return formatJSONResponse(500, {
      message: "Internal Server Error",
    });
  }

  try {
    const { Items } = await client.scan({ TableName: TABLES.USER });

    if (!Items || Items.length < 2) {
      return formatJSONResponse(204, {
        message: "No Items",
      });
    }

    const sortedMembers = Items.map((item) => unmarshall(item)).sort((a, b) =>
      a.last_host.localeCompare(b.last_host)
    );

    const [todayHost, nextHost] = sortedMembers;

    await got.post(SLACK_INCOMING_WEBHOOK_ENDPOINT, {
      json: {
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
                type: "plain_text",
                emoji: true,
                text: `다음 스탠드업 진행자: \`${nextHost.real_name}\`님`,
              },
            ],
          },
          // {
          //   type: "divider",
          // },
          // {
          //   type: "actions",
          //   elements: [
          //     {
          //       type: "button",
          //       text: {
          //         type: "plain_text",
          //         text: "호스트 건너뛰기",
          //         emoji: true,
          //       },
          //       value: "skip_host",
          //       url: "",
          //     },
          //   ],
          // },
        ],
      },
    });

    const params = {
      TableName: TABLES.USER,
      Key: {
        id: {
          S: todayHost.id,
        },
      },
      UpdateExpression: "SET #last_host = :last_host_value",
      ExpressionAttributeNames: {
        "#last_host": "last_host",
      },
      ExpressionAttributeValues: {
        ":last_host_value": { S: dayjs().toISOString() },
      },
    };

    const { $metadata } = await client.send(new UpdateItemCommand(params));
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
