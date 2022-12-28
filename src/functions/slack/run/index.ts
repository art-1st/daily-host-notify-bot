import { handlerPath } from "@libs/handler-resolver";

export default {
  handler: `${handlerPath(__dirname)}/handler.main`,
  events: [
    // {
    //   http: {
    //     method: "get",
    //     path: "run",
    //   },
    // },
    {
      schedule: "cron(0 1 ? * 2-6 *)",
    },
  ],
};
