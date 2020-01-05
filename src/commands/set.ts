import moment = require('moment');

import { Command, CommandFn } from '../interfaces';
import { parseDate, formatDate } from '../dates';
import { setBirthday as setBirthdayInDb } from '../database';
import { updateList } from '../updateList';
import { Message } from 'discord.js';
import { Log } from '../logging';
import { emoji } from '../emoji';

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
  const userId = msg.member.id;

  const user = msg.member;

  const date = params.join(' ');
  const parsedDate = parseDate(date);

  if (parsedDate instanceof Array) {
    const ukFormat = formatDate(parsedDate[0]);
    const usFormat = formatDate(parsedDate[1]);

    await updateBirthday(server, userId, parsedDate[1]);

    Log.green('Birthday updated', `**${usFormat}**`, server, { user });

    const sentMessage = await msg.channel.send(
      `${emoji.success} Got it! Heads up, ${date} is ambiguous, so I assumed you meant ${usFormat}. If you meant ${ukFormat} instead, do "set ${ukFormat}".`
    );
    setTimeout(() => {
      msg.delete();
      (sentMessage as Message).delete();
    }, 10000);
  }

  const moment = parsedDate as moment.Moment;
  if (!parsedDate || !moment.isValid()) {
    const examples = VALID_FORMATS.map(format => `"set ${format}"`).join(
      ' or '
    );

    const sentMessage = await msg.channel.send(
      `${emoji.error} I don't understand that date. Try something like ${examples}.`
    );
    setTimeout(() => {
      msg.delete();
      (sentMessage as Message).delete();
    }, 10000);
  }

  await updateBirthday(server, userId, moment);

  Log.green('Birthday updated', `**${formatDate(moment)}**`, server, { user });

  const sentMessage = await msg.channel.send(`${emoji.success} Got it!`);
  setTimeout(() => {
    msg.delete();
    (sentMessage as Message).delete();
  }, 5000);
};

export const set: Command = {
  params: ['date'],
  description: 'Tells me when your birthday is, e.g. "set 18/10".',
  fn: setBirthday
};
