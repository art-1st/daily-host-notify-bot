import { marshall, unmarshall } from "@aws-sdk/util-dynamodb";
import { formatJSONResponse } from "@libs/api-gateway";
import { TABLES } from "src/constants";
import { ddbClient, slackWebClient } from "src/client";
import { generateRunMessage } from "@functions/slack/run/helper/message";
import { Channel } from "@libs/channel";
import { ChannelData } from "src/types/data";

const { SLACK_BOT_TOKEN } = process.env;

type EventBridgeTargetBody = {
  channel_id: string;
};

const run = async (event: EventBridgeTargetBody) => {
  const { channel_id } = event;
  if (!SLACK_BOT_TOKEN) {
    return formatJSONResponse(500, {
      message: "Internal Server Error",
    });
  }

  try {
    const { Item } = await ddbClient.getItem({
      TableName: TABLES.TABLE,
      Key: marshall({
        channel_id,
      }),
    });

    if (!Item) {
      console.error("Cannot find channel data from DynamoDB");
      return formatJSONResponse(500, {});
    }

    const channelData = unmarshall(Item) as ChannelData;
    const channel = new Channel(channelData);

    const hosts = channel.pickUserAndAdjust();

    const { ok } = await slackWebClient.chat.postMessage(
      generateRunMessage({
        channel_id,
        now_host_id: hosts.now,
        next_host_id: hosts.next,
        header_text: channel.message_header,
        content_text: channel.message_content,
        googlemeet_link: channel.googlemeet_link,
      })
    );
    console.log("Webhook Success: ", ok);

    const nextUsers = channel.getUserString();

    const { $metadata } = await ddbClient.updateItem({
      TableName: TABLES.TABLE,
      Key: marshall({
        channel_id,
      }),
      UpdateExpression: "SET #users = :users",
      ExpressionAttributeNames: {
        "#users": "users",
      },
      ExpressionAttributeValues: marshall({
        ":users": nextUsers,
      }),
    });
    console.log($metadata);

    return formatJSONResponse(200, {});
  } catch (e) {
    console.log(e);

    return formatJSONResponse(500, {
      message: "Internal Server Error",
    });
  }
};

export const main = run;
