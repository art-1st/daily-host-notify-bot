interface MessageProps {
  channel: string;
  todayHost: Record<string, any>;
  todayHostNewHostDate: string;
  nextHost: Record<string, any>;
  kanbanName: string;
  kanbanUrl: string;
}

export function generateMessage({
  channel,
  todayHost,
  todayHostNewHostDate,
  nextHost,
  kanbanName,
  kanbanUrl,
}: MessageProps) {
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
          text: `오늘의 데일리 스탠드업 진행자는 <@${todayHost.id}>님입니다.`,
        },
      },
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: `*진행자 역할*\n- <${kanbanUrl}|${kanbanName}> 화면 공유\n- 스탠드업 진행`,
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
              text: "진행자 건너뛰기",
              emoji: true,
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
