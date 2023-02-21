import { DynamoDB } from "@aws-sdk/client-dynamodb";
import { LambdaClient } from "@aws-sdk/client-lambda";
import { CloudWatchEventsClient } from "@aws-sdk/client-cloudwatch-events";
import { WebClient } from "@slack/web-api";

const { AWS_REGION, SLACK_BOT_TOKEN } = process.env;

const slackWebClient = new WebClient(SLACK_BOT_TOKEN);
const ddbClient = new DynamoDB({ region: AWS_REGION });
const lambdaClient = new LambdaClient({ region: AWS_REGION });
const cloudwatchEventsClient = new CloudWatchEventsClient({
  region: AWS_REGION,
});

export { slackWebClient, ddbClient, lambdaClient, cloudwatchEventsClient };
