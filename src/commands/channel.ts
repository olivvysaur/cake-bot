import { Command, CommandFn } from '../interfaces';

const setChannel: CommandFn = (params, msg) => {};

export const channel: Command = {
  params: ['#name'],
  description:
    'Changes which channel birthday messages are posted in, e.g. "channel #birthdays".',
  fn: setChannel
};
