import {
  ActionsBlock,
  Block,
  ChatPostMessageArguments,
  KnownBlock,
} from "@slack/web-api";

interface MessageProps {
  channel_id: string;
  now_host_id: string;
  next_host_id: string;
  header_text: string;
  content_text: string;
  googlemeet_link: string;
}

export function generateRunMessage({
  channel_id,
  now_host_id,
  next_host_id,
  header_text,
  content_text,
  googlemeet_link,
}: MessageProps): ChatPostMessageArguments {
  const messageObject: {
    channel: string;
    blocks: KnownBlock[];
  } = {
    channel: channel_id,
    blocks: [
      {
        type: "header",
        text: {
          type: "plain_text",
          text: header_text,
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
          text: `오늘의 데일리 스탠드업 진행자는 <@${now_host_id}>님입니다.\n논의할 안건이 있는 분은 스레드로 내용을 요약하여 남겨주세요.`,
        },
      },
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: content_text,
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
            text: `다음 스탠드업 진행자: <@${next_host_id}> 님`,
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
            style: "danger",
            confirm: {
              title: {
                type: "plain_text",
                text: "진행자를 건너뛰시겠습니까?",
                emoji: true,
              },
              text: {
                type: "mrkdwn",
                text: "진행자를 건너뛴 후 취소할 수 없습니다.",
              },
              confirm: {
                type: "plain_text",
                text: "건너뛰기",
              },
              deny: {
                type: "plain_text",
                text: "취소",
              },
            },
            value: JSON.stringify({
              type: "skip_host",
            }),
          },
        ],
      },
    ],
  };

  if (googlemeet_link) {
    const actionBlock = messageObject.blocks.at(-1) as ActionsBlock;
    actionBlock.elements.unshift({
      type: "button",
      text: {
        type: "plain_text",
        text: ":googlecalendar: Google Meet 참여",
        emoji: true,
      },
      style: "primary",
      url: googlemeet_link,
    });
  }

  return messageObject;
}
