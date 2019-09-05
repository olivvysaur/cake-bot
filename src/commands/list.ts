import { RichEmbed } from 'discord.js';
import moment from 'moment';

import { Command, CommandFn } from '../interfaces';
import { getBirthdays } from '../database';
import { getUsername } from '../users';

const MONTHS = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
const MONTH_NAMES = moment.months();

const listBirthdays: CommandFn = async (params, msg) => {
  const serverId = msg.guild.id;
  const birthdays = await getBirthdays(serverId);
  console.log(birthdays);

  const embed = new RichEmbed();

  MONTHS.forEach(month => {
    const monthName = MONTH_NAMES[month];
    const monthBirthdays = birthdays[month.toString()];

    if (!monthBirthdays) {
      embed.addField(monthName, '\u200B\n\u200B', false);
      return;
    }

    const list = Object.keys(monthBirthdays).reduce((result, day) => {
      const dayBirthdays = monthBirthdays[day]
        .filter(Boolean)
        .map((userId: string) => getUsername(serverId, userId))
        .join(', ');

      return `${result}\n${day}: ${dayBirthdays}`;
    }, '');

    embed.addField(monthName, `${list}\n\u200B`, false);
  });

  return msg.channel.send(embed);
};

export const list: Command = {
  params: [],
  description: 'Displays the birthdays of everyone on the server.',
  fn: listBirthdays
};
