import {
  formatJSONResponse,
  ValidatedEventAPIGatewayProxyEvent,
} from "@libs/api-gateway";
import { interactiveMessageDialogSubmissionResolver } from "./resolver/dialog_submission";

const { SERVICE_NAME, SLACK_BOT_TOKEN } = process.env;

// const lambdaClient = new LambdaClient({ region: AWS_REGION });
// const client = new DynamoDB({ region: AWS_REGION });

const interactiveMessages: ValidatedEventAPIGatewayProxyEvent<any> = async (
  event
) => {
  const { body } = event;

  if (!SERVICE_NAME || !SLACK_BOT_TOKEN) {
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
    console.info("[RAW PAYLOAD]", slackResponsePayload);
    const payload = JSON.parse(
      decodeURIComponent(slackResponsePayload).replace(/\+/g, " ")
    ) as SlackInteractiveMessageCommonPayload;

    switch (payload.type) {
      case "dialog_submission":
        return await interactiveMessageDialogSubmissionResolver(payload);
      // case "skip_host":
      // break;
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
