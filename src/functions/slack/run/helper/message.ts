import { ChatPostMessageArguments } from "@slack/web-api";

interface MessageProps {
  channel: string;
  todayHost: Record<string, any>;
  todayHostNewHostDate: string;
  nextHost: Record<string, any>;
  googleMeetUrl: string;
  kanbanName: string;
  kanbanUrl: string;
}

export function generateRunMessage({
  channel,
  todayHost,
  todayHostNewHostDate,
  nextHost,
  googleMeetUrl,
  kanbanName,
  kanbanUrl,
}: MessageProps): ChatPostMessageArguments {
  return {
    channel,
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
          text: `오늘의 데일리 스탠드업 진행자는 <@${todayHost.id}>님입니다.\n논의할 안건이 있는 분은 스레드로 내용을 요약하여 남겨주세요.`,
        },
      },
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: `*진행자 역할*\n- <${kanbanUrl}|${kanbanName}> 화면 공유\n- 스탠드업 진행\n- 안건에 대한 논의 진행`,
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
              text: ":googlecalendar: Google Meet 참여",
              emoji: true,
            },
            style: "primary",
            url: googleMeetUrl,
          },
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
  };
}
