import { Command, CommandFn } from '../interfaces';

const listBirthdays: CommandFn = (params, msg) => {};

export const list: Command = {
  params: [],
  description: 'Displays the birthdays of everyone on the server.',
  fn: listBirthdays
};
