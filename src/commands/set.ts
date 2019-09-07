import moment = require('moment');

import { Command, CommandFn } from '../interfaces';
import { parseDate, formatDate } from '../dates';
import { setBirthday as setBirthdayInDb } from '../database';
import { updateList } from '../updateList';

const VALID_FORMATS = ['18 October', '18/10'];

const updateBirthday = async (
  serverId: string,
  userId: string,
  birthday: moment.Moment
) => {
  await setBirthdayInDb(serverId, userId, birthday);
  await updateList(serverId);
};

const setBirthday: CommandFn = async (params, msg) => {
  if (params.length < 1) {
    return;
  }

  const server = msg.guild.id;
  const user = msg.member.id;

  const date = params.join(' ');
  const parsedDate = parseDate(date);

  if (parsedDate instanceof Array) {
    const ukFormat = formatDate(parsedDate[0]);
    const usFormat = formatDate(parsedDate[1]);

    await updateBirthday(server, user, parsedDate[1]);

    return msg.channel.send(
      `Heads up, ${date} is ambiguous, so I assumed you meant ${usFormat}. If you meant ${ukFormat} instead, do "set ${ukFormat}".`
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

  await updateBirthday(server, user, parsedDate);
  return msg.channel.send('✅ Got it!');
};

export const set: Command = {
  params: ['date'],
  description: 'Tells me when your birthday is, e.g. "set 18/10".',
  fn: setBirthday
};
