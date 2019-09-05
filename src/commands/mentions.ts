import { Command, CommandFn } from '../interfaces';

const toggleMentions: CommandFn = (params, msg) => {};

export const mentions: Command = {
  params: ['on/off'],
  description:
    'Turns @mentions on or off in birthday messages, e.g. "mentions off".',
  fn: toggleMentions
};
