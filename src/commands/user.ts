import { Command, CommandFn } from '../interfaces';
import { findUser } from '../users';
import { RichEmbed } from 'discord.js';

const getUserInfo: CommandFn = (params, msg) => {
  const serverId = msg.guild.id;

  const query = params[0];
  const user = findUser(query, serverId);

  if (!user) {
    msg.channel.send(`⚠️ I couldn't find a user named "${query}".`);
    return;
  }

  const {
    displayColor,
    displayName,
    nickname,
    joinedAt,
    colorRole,
    user: { avatarURL, bot, tag, username }
  } = user;

  const embed = new RichEmbed();
  embed.title = `Info about user ${displayName}`;
  embed.author = { name: displayName, icon_url: avatarURL };
  embed.footer = { text: 'Member since' };
  embed.timestamp = joinedAt;
  embed.color = displayColor;
  if (!!nickname) {
    embed.addField('Also known as', username, true);
  }
  embed.addField('Discord tag', tag, true);
  embed.addField('Colour', colorRole, true);
  embed.addField('Bot', bot ? 'Yes' : 'No');

  msg.channel.send(embed);
};

export const user: Command = {
  params: ['name'],
  description: 'Get information about a person, e.g. "user valentine".',
  fn: getUserInfo,
  hidden: true
};
