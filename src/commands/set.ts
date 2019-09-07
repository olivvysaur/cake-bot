import moment = require('moment');

import { Command, CommandFn } from '../interfaces';
import { parseDate, formatDate } from '../dates';
import { setBirthday as setBirthdayInDb } from '../database';
import { updateList } from '../updateList';

const VALID_FORMATS = ['18 October', '18/10'];

const setBirthday: CommandFn = async (params, msg) => {
  if (params.length < 1) {
    return;
  }

  const date = params.join(' ');
  const parsedDate = parseDate(date);

  if (parsedDate instanceof Array) {
    const option1 = formatDate(parsedDate[0]);
    const option2 = formatDate(parsedDate[1]);

    return msg.channel.send(
      `${date} is ambiguous – try "set ${option1}" or "set ${option2}".`
    );
  }

  const moment = parsedDate as moment.Moment;
  if (!parsedDate || !moment.isValid()) {
    const examples = VALID_FORMATS.map(format => `"set ${format}"`).join(
      ' or '
    );

    return msg.channel.send(
      `I don't understand that date. Try something like ${examples}.`
    );
  }

  const server = msg.guild.id;
  const user = msg.member.id;

  await setBirthdayInDb(server, user, moment);
  await updateList(server);

  msg.delete();
};

export const set: Command = {
  params: ['date'],
  description: 'Tells me when your birthday is, e.g. "set 18/10".',
  fn: setBirthday
};
