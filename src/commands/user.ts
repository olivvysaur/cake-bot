import { RichEmbed } from 'discord.js';

import { Command, CommandFn } from '../interfaces';
import { findUser } from '../users';
import { timeSince } from '../dates';
import { emoji } from '../emoji';

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
    user: { avatarURL, bot, tag, id }
  } = user;

  const timeSinceJoining = timeSince(joinedAt);
  const shortTimeSinceJoining = timeSinceJoining.asString
    .split(', ')
    .slice(0, 2)
    .join(', ');

  const rolesList = roles
    .array()
    .filter(role => role.name !== '@everyone')
    .sort((a, b) => (a.name.toLowerCase() < b.name.toLowerCase() ? -1 : 1))
    .join(' ');

  const embed = new RichEmbed();
  embed.title = `Info about user ${displayName}`;
  embed.author = { name: displayName, icon_url: avatarURL };
  embed.color = displayColor;
  embed.addField('Display name', user, true);
  embed.addField('Discord tag', tag, true);
  embed.addField('User ID', id, true);
  embed.addField('Bot', bot ? 'Yes' : 'No', true);
  embed.addField('Colour', colorRole || 'None', true);
  embed.addField('Member for', shortTimeSinceJoining, true);
  embed.addField('Roles', !!rolesList.length ? rolesList : 'None', false);

  msg.channel.send(embed);
};

export const user: Command = {
  params: ['name'],
  description: 'Get information about a person, e.g. "user valentine".',
  fn: getUserInfo,
  hidden: true
};
