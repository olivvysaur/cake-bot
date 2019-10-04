import { RichEmbed } from 'discord.js';

import { Command, CommandFn } from '../interfaces';
import { findUser } from '../users';
import { timeSince } from '../dates';

const getUserInfo: CommandFn = (params, msg) => {
  const serverId = msg.guild.id;

  const query = params.join(' ');
  const user = findUser(query, serverId);

  if (!user) {
    msg.channel.send(`⚠️ I couldn't find a user named "${query}".`);
    return;
  }

  const {
    displayColor,
    displayName,
    joinedAt,
    colorRole,
    user: { avatarURL, bot, tag, id }
  } = user;

  const timeSinceJoining = timeSince(joinedAt);

  const embed = new RichEmbed();
  embed.title = `Info about user ${displayName}`;
  embed.author = { name: displayName, icon_url: avatarURL };
  embed.footer = { text: `User ID: ${id}` };
  embed.color = displayColor;
  embed.addField('Discord tag', tag, true);
  embed.addField('Colour', colorRole, true);
  embed.addField('Bot', bot ? 'Yes' : 'No', true);
  embed.addField('Member for', timeSinceJoining.asString);

  msg.channel.send(embed);
};

export const user: Command = {
  params: ['name'],
  description: 'Get information about a person, e.g. "user valentine".',
  fn: getUserInfo,
  hidden: true
};
