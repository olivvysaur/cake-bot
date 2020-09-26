import { RichEmbed } from 'discord.js';

import { Command, CommandFn } from '../interfaces';
import { findUser } from '../users';
import { formatDate, timeSince } from '../dates';
import { emoji } from '../emoji';
import moment from 'moment';
import { DB, getBirthdays } from '../database';

const getUserInfo: CommandFn = async (params, msg) => {
  const serverId = msg.guild.id;

  const query = params.join(' ');
  const user = findUser(query, serverId);

  if (!user) {
    msg.channel.send(`${emoji.error} I couldn't find a user named "${query}".`);
    return;
  }

  const {
    displayColor,
    displayName,
    joinedAt,
    colorRole,
    roles,
    user: { avatarURL, tag, id },
  } = user;

  const joinDate = moment(joinedAt).format('LL');

  const timeSinceJoining = timeSince(joinedAt);
  const shortTimeSinceJoining = timeSinceJoining.asString
    .split(', ')
    .slice(0, 2)
    .join(', ');

  const rolesList = roles
    .array()
    .filter((role) => role.name !== '@everyone')
    .sort((a, b) => (a.name.toLowerCase() < b.name.toLowerCase() ? -1 : 1))
    .join(' ');

  let birthday = 'Unknown';
  const birthdayData = await DB.getPath(`birthdays/${serverId}/${user.id}`);
  if (birthdayData) {
    const { month, day } = birthdayData;
    const date = moment().month(month).date(day);
    birthday = formatDate(date);
  }

  const embed = new RichEmbed();
  embed.author = { name: displayName, icon_url: avatarURL };
  embed.color = displayColor;
  embed.addField('Display name', user, true);
  embed.addField('Discord tag', tag, true);
  embed.addField('User ID', id, true);
  embed.addField('Colour', colorRole || 'None', true);
  embed.addField('Member for', shortTimeSinceJoining, true);
  embed.addField('Joined', joinDate, true);
  embed.addField('Birthday', birthday, true);
  embed.addField('Roles', !!rolesList.length ? rolesList : 'None', false);

  msg.channel.send(embed);
};

export const user: Command = {
  params: ['name'],
  description: 'Get information about a person, e.g. "user valentine".',
  fn: getUserInfo,
  hidden: true,
};
