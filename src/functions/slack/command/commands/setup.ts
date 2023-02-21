import { marshall } from "@aws-sdk/util-dynamodb";
import { formatJSONResponse } from "@libs/api-gateway";
import CommandError from "@libs/command-error";
import { generateSlackBlockMessageResponse } from "@libs/message";
import { ddbClient, slackWebClient } from "src/client";
import { TABLES } from "src/constants";
import { CommandRequestPayload } from "src/types/command";

export async function commandSetup(payload: CommandRequestPayload) {
  const { channel_id, trigger_id } = payload;

  try {
    const { Item } = await ddbClient.getItem({
      TableName: TABLES.TABLE,
      Key: marshall({ channel_id }),
    });

    const isChannelExist = Item !== undefined;

    await slackWebClient.dialog.open({
      trigger_id,
      dialog: {
        title: isChannelExist ? "채널 미팅정보 수정하기" : "채널 미팅 구성하기",
        callback_id: "setup-channel-callback",
        submit_label: isChannelExist ? "수정" : "저장",
        notify_on_cancel: false,
        state: isChannelExist ? "modify" : "create",
        elements: [
          {
            type: "text",
            label: "메시지 제목",
            name: "header",
          },
          {
            type: "textarea",
            label: "메시지 내용",
            name: "content",
          },
          {
            type: "text",
            label: "Google Meet 링크 (선택)",
            name: "googlemeet_link",
            placeholder: "https://meet.google.com/",
          },
          {
            type: "select",
            label: "메시지 전송 시간 (UTC+09:00/월-금)",
            name: "notification_time",
            options: [
              {
                label: "09:00",
                value: "09:00",
              },
              {
                label: "09:30",
                value: "09:30",
              },
              {
                label: "10:00",
                value: "10:00",
              },
              {
                label: "10:30",
                value: "10:30",
              },
              {
                label: "11:00",
                value: "11:00",
              },
              {
                label: "11:30",
                value: "11:30",
              },
              {
                label: "12:00",
                value: "12:00",
              },
              {
                label: "13:00",
                value: "13:00",
              },
              {
                label: "13:30",
                value: "13:30",
              },
              {
                label: "14:00",
                value: "14:00",
              },
              {
                label: "14:30",
                value: "14:30",
              },
              {
                label: "15:00",
                value: "15:00",
              },
              {
                label: "15:30",
                value: "15:30",
              },
              {
                label: "16:00",
                value: "16:00",
              },
              {
                label: "16:30",
                value: "16:30",
              },
              {
                label: "17:00",
                value: "17:00",
              },
              {
                label: "17:30",
                value: "17:30",
              },
            ],
          },
        ],
      },
    });

    return generateSlackBlockMessageResponse(200, {
      blocks: [
        {
          type: "section",
          text: {
            type: "plain_text",
            text: "다이얼로그에서 계속 진행해주세요.",
            emoji: true,
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
    const data = (e as any).data;
    if (data) {
      console.log(data.response_metadata?.messages);
    }
    return formatJSONResponse(500, {
      message: "Internal Server Error",
    });
  }
}
