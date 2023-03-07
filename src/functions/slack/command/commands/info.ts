import { marshall, unmarshall } from "@aws-sdk/util-dynamodb";
import { formatJSONResponse } from "@libs/api-gateway";
import CommandError, { CommandErrorName } from "@libs/command-error";
import { Channel } from "@libs/channel";
import { generateSlackBlockMessageResponse } from "@libs/message";
import { ddbClient } from "src/client";
import { TABLES } from "src/constants";
import { CommandRequestPayload } from "src/types/command";
import { ChannelData } from "src/types/data";

export async function commandShowInfo(payload: CommandRequestPayload) {
  const { channel_id } = payload;

  try {
    const { Item } = await ddbClient.getItem({
      TableName: TABLES.TABLE,
      Key: marshall({ channel_id }),
    });

    if (!Item) {
      throw new CommandError(CommandErrorName.COMMON_CHANNEL_NOT_EXIST);
    }

    const channelData = unmarshall(Item) as ChannelData;
    const { users } = new Channel(channelData);

    if (!users || !users.length) {
      throw new CommandError(CommandErrorName.COMMON_CHANNEL_NO_USERS);
    }

    const membersText = users.map((user) => `<@${user}>`).join("\n");

    return generateSlackBlockMessageResponse(200, {
      response_type: "in_channel",
      blocks: [
        {
          type: "section",
          text: {
            type: "plain_text",
            text: "채널 사용자 정보",
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
