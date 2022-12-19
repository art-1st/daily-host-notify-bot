import "typescript";

declare global {
  namespace NodeJS {
    interface ProcessEnv {
      AWS_REGION?: string;
      SLACK_INCOMING_WEBHOOK_ENDPOINT?: string;
      JIRA_KANBAN_NAME?: string;
      JIRA_KANBAN_URL?: string;
    }
  }
}

export {};
