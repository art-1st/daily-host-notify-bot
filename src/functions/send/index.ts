import { handlerPath } from "@libs/handler-resolver";

export default {
  handler: `${handlerPath(__dirname)}/handler.main`,
  events: [
    {
      http: {
        method: "post",
        path: "send",
      },
    },
    {
      schedule: "cron(0 1 ? * 2-6 *)",
    },
  ],
};
