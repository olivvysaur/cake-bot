import schedule from 'node-schedule';

import { time } from './times';

interface RecurringCallbackConfig {
  callback: () => void;
  hour: number;
  minute: number;
  name?: string;
}

export const scheduleRecurringCallback = ({
  hour,
  minute,
  callback,
  name
}: RecurringCallbackConfig) => {
  const rule = new schedule.RecurrenceRule();
  rule.hour = hour;
  rule.minute = minute;

  schedule.scheduleJob(rule, callback);
  console.log(`Scheduled ${name}  ${time(rule.hour, rule.minute)} UTC`);
};
