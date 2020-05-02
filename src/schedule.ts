import schedule from 'node-schedule';

import { time } from './times';

const scheduledCallbacks: string[] = [];

interface RecurringCallbackConfig {
  callback: () => void;
  hour: number;
  minute: number;
  name: string;
}

export const scheduleRecurringCallback = ({
  hour,
  minute,
  callback,
  name,
}: RecurringCallbackConfig) => {
  if (scheduledCallbacks.includes(name)) {
    console.log(`${name} is already scheduled, skipping scheduling`);
  }

  const rule = new schedule.RecurrenceRule();
  rule.hour = hour;
  rule.minute = minute;

  schedule.scheduleJob(rule, callback);
  scheduledCallbacks.push(name);
  console.log(`Scheduled for ${time(rule.hour, rule.minute)} - ${name}`);
};
