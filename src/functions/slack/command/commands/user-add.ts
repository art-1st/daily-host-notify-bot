import { marshall, unmarshall } from "@aws-sdk/util-dynamodb";
import { formatJSONResponse } from "@libs/api-gateway";
import CommandError, { CommandErrorName } from "@libs/command-error";
import { Channel } from "@libs/channel";
import { generateSlackBlockMessageResponse } from "@libs/message";
import { ddbClient, slackWebClient } from "src/client";
import { TABLES } from "src/constants";
import { CommandRequestPayload } from "src/types/command";
import { ChannelData } from "src/types/data";

export async function commandAddUser(payload: CommandRequestPayload) {
  const { channel_id } = payload;

  try {
    const conversationMembers = await slackWebClient.conversations.members({
      channel: channel_id,
    });

    if (
      !conversationMembers.members ||
      !conversationMembers.members.includes(payload.text)
    ) {
      throw new CommandError(CommandErrorName.COMMON_USER_NOT_IN_THIS_CHANNEL);
    }

    const { user } = await slackWebClient.users.info({
      user: payload.text,
    });

    if (!user || !user.id || !user.real_name) {
      throw new CommandError(CommandErrorName.COMMON_SLACK_USER_NOT_FOUND);
    }

    const { Item } = await ddbClient.getItem({
      TableName: TABLES.TABLE,
      Key: marshall({ channel_id }),
    });

    if (!Item) {
      throw new CommandError(CommandErrorName.COMMON_CHANNEL_NOT_EXIST);
    }

    const channelData = unmarshall(Item) as ChannelData;
    const channel = new Channel(channelData);

    if (channel.hasUser(user.id)) {
      throw new CommandError(CommandErrorName.SET_USER_ALREADY_EXISTS);
    }

    channel.addUser(user.id);
    const userStr = channel.getUserString();

    await ddbClient.updateItem({
      TableName: TABLES.TABLE,
      Key: marshall({ channel_id }),
      UpdateExpression: "SET #users = :value",
      ExpressionAttributeNames: {
        "#users": "users",
      },
      ExpressionAttributeValues: marshall({
        ":value": userStr,
      }),
    });

    return generateSlackBlockMessageResponse(200, {
      blocks: [
        {
          type: "section",
          text: {
            type: "mrkdwn",
            // text: `<@${user.id}> (Member ID: ${user.id})님이 추가되었습니다.`,
            text: `<${user.id}> (Member ID: ${user.id})님이 추가되었습니다.`,
          },
        },
      ],
    });
  } catch (e) {
    if (e instanceof CommandError) {
      return generateSlackBlockMessageResponse(200, {
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
