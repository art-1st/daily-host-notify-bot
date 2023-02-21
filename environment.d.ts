import "typescript";

declare global {
  namespace NodeJS {
    interface ProcessEnv {
      AWS_REGION?: string;
      SERVICE_NAME?: string;
      AWS_ACCOUNT_ID?: string;
      SLACK_BOT_TOKEN?: string;
      DDB_TABLE_NAME?: string;
    }
  }
}

export {};
