import { Command, CommandFn } from '../interfaces';
import { findUser } from '../users';
import { emoji } from '../emoji';
import { RichEmbed, GuildMember } from 'discord.js';
import { DISCORD_BG_COLOUR } from '../constants';

const buildReply = (user: GuildMember) => {
  const {
    displayName,
    displayHexColor,
    user: { avatarURL }
  } = user;

  const embed = new RichEmbed();
  embed.title = `Avatar for ${displayName}`;
  embed.image = { url: avatarURL };
  embed.setColor(displayHexColor);

  return embed;
};

const getAvatar: CommandFn = (params, msg) => {
  const serverId = msg.guild.id;

  const query = params.length ? params.join(' ') : msg.author.tag;
  const user = findUser(query, serverId);

  if (!user && query.toLowerCase() === 'random') {
    const randomMember = msg.guild.members
      .filter(user => !!user.user.avatarURL)
      .random();
    const reply = buildReply(randomMember);
    return msg.channel.send(reply);
  }

  if (!user) {
    msg.channel.send(`${emoji.error} I couldn't find a user named "${query}".`);
    return;
  }

  const reply = buildReply(user);
  return msg.channel.send(reply);
};

export const avatar: Command = {
  fn: getAvatar,
  description: "Shows a user's current avatar.",
  params: ['user']
};
