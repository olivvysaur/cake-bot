import moment from 'moment';
import { RichEmbed, Guild, TextChannel, Message } from 'discord.js';

import { client } from './index';
import {
  getBirthdays,
  getServerListMessage,
  getServerChannel,
  setServerListMessage,
  removeBirthday
} from './database';
import { getUsername } from './users';

const MONTHS = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
const MONTH_NAMES = moment.months();

const listBirthdays = async (serverId: string) => {
  const birthdays = await getBirthdays(serverId);

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
        .map((userId: string) => getUsername(serverId, userId))
        .filter(Boolean)
        .join(', ');

      if (dayBirthdays.length === 0) {
        return result;
      }

      return `${result}\n${day}: ${dayBirthdays}`;
    }, '');

    const monthText = list.length ? `${list}\n\u200B` : `\u200B\n\u200B`;

    embed.addField(monthName, monthText, false);
  });

  return embed;
};

const removeAbsentUsers = async (serverId: string) => {
  const birthdays = await getBirthdays(serverId);
  MONTHS.forEach(month => {
    const monthBirthdays = birthdays[month.toString()];

    if (!monthBirthdays) {
      return;
    }

    Object.keys(monthBirthdays).forEach(day => {
      monthBirthdays[day]
        .filter((userId: string) => getUsername(serverId, userId) === null)
        .forEach((userId: string) => removeBirthday(serverId, userId));
    });
  });
};

export const updateList = async (serverId: string) => {
  const channelId = await getServerChannel(serverId);
  const listMessageId = await getServerListMessage(serverId);

  const server = client.guilds.get(serverId);
  if (!server) {
    return;
  }

  const channel = server.channels.get(channelId) as TextChannel;
  if (!channel) {
    return;
  }

  const embed = await listBirthdays(serverId);

  if (listMessageId) {
    const message = await channel.fetchMessage(listMessageId);
    message.edit('', embed);
  } else {
    const sentMessage = await channel.send(embed);
    if (sentMessage) {
      setServerListMessage(serverId, (sentMessage as Message).id);
      (sentMessage as Message).pin();
    }
  }

  removeAbsentUsers(serverId);
};
