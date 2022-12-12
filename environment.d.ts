import "typescript";

declare global {
  namespace NodeJS {
    interface ProcessEnv {
      SLACK_INCOMING_WEBHOOK_ENDPOINT?: string;
    }
  }
}

export {};
