import { Command, CommandFn } from '../interfaces';
import { CHANNEL_REGEX } from '../constants';
import { emoji } from '../emoji';
import { client } from '..';
import { TextChannel } from 'discord.js';
import { DB } from '../database';
import { pluralise } from '../strings';

const configureAutoPurge: CommandFn = async (params, msg) => {
  const serverId = msg.guild.id;

  if (params.length < 2) {
    return msg.channel.send(
      `${emoji.error} I need to know which channel to configure auto purge for and how to configure it.`
    );
  }

  const match = params[0].match(CHANNEL_REGEX);
  if (!match) {
    return msg.channel.send(
      `${emoji.error} I need to know which channel to configure auto purge for.`
    );
  }

  const channelId = match[1];
  const channel = client.channels.get(channelId) as TextChannel;
  if (!channel) {
    return msg.channel.send(`${emoji.error} I couldn't find that channel.`);
  }

  if (params[1] === 'disable') {
    await DB.deletePath(`autoPurge/${serverId}/${channelId}`);
    return msg.channel.send(
      `${emoji.success} Auto purge disabled for ${channel}.`
    );
  }

  const minAge = Math.floor(Number(params[1]));
  if (isNaN(minAge)) {
    return msg.channel.send(
      `${emoji.error} I need to know how far back to auto purge messages, in days.`
    );
  }

  await DB.setPath(`autoPurge/${serverId}/${channelId}`, minAge);
  return msg.channel.send(
    `${emoji.success} Messages older than ${pluralise(
      minAge,
      'day'
    )} will be purged in ${channel}.`
  );
};

export const autopurge: Command = {
  fn: configureAutoPurge,
  description: 'Configures auto purge for a channel.',
  params: ['channel', 'ageInDays'],
  requiresMod: true,
};
