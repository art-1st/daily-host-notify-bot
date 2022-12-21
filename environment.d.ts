import "typescript";

declare global {
  namespace NodeJS {
    interface ProcessEnv {
      AWS_REGION?: string;
      SERVICE_NAME?: string;
      SLACK_CHANNEL_ID?: string;
      SLACK_BOT_TOKEN?: string;
      JIRA_KANBAN_NAME?: string;
      JIRA_KANBAN_URL?: string;
    }
  }
}

export {};
