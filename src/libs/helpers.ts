import { parseExpression } from "cron-parser";

/**
 * @description AWS EventBridge CronExpression to Hours and Minutes
 * @param expression i.e. 'cron(0 8 ? * 2-6 *)'
 */
export function eventBridgeCronExpressionToHhMm(expression: string) {
  const cronExpression =
    "0 " + expression.replace(/^cron\((.*)\)$/, "$1").replaceAll("?", "*");
  const interval = parseExpression(
    cronExpression.substring(cronExpression.length - 2, 2)
  );
  const hour = interval.fields.hour[0] + 9;
  const hh = hour.toString().padStart(2, "0");
  const mm = interval.fields.minute[0].toString().padStart(2, "0");

  return {
    hh,
    mm,
  };
}
