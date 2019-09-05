import { Command, CommandFn } from '../interfaces';

const setBirthday: CommandFn = (params, msg) => {};

export const set: Command = {
  params: ['date'],
  description: 'Tells Cake Bot when your birthday is, e.g. "set 18/10".',
  fn: setBirthday
};
