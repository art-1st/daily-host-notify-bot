// import { DynamoDB } from "@aws-sdk/client-dynamodb";
// import { marshall, unmarshall } from "@aws-sdk/util-dynamodb";
// import {
//   InvokeCommand,
//   InvokeCommandInput,
//   LambdaClient,
// } from "@aws-sdk/client-lambda";
import {
  formatJSONResponse,
  ValidatedEventAPIGatewayProxyEvent,
} from "@libs/api-gateway";
import { generateSlackBlockMessageResponse } from "@libs/message";
// import { WebClient } from "@slack/web-api";
// import { TABLES } from "src/constants";
import { CommandRequestPayload } from "src/types/command";

const {
  // AWS_REGION,
  SERVICE_NAME,
  SLACK_BOT_TOKEN,
  GOOGLE_MEET_URL,
  JIRA_KANBAN_NAME,
  JIRA_KANBAN_URL,
} = process.env;

// const lambdaClient = new LambdaClient({ region: AWS_REGION });
// const ddbClient = new DynamoDB({ region: AWS_REGION });

const command: ValidatedEventAPIGatewayProxyEvent<any> = async (event) => {
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

  // const slackWeb = new WebClient(SLACK_BOT_TOKEN);

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
    const payload = Object.fromEntries(
      new URLSearchParams(body)
    ) as unknown as CommandRequestPayload;

    return generateSlackBlockMessageResponse(200, {
      blocks: [
        {
          type: "section",
          text: {
            type: "mrkdwn",
            text: `Hello ${payload.text}.`,
          },
        },
      ],
    });
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

export const main = command;
