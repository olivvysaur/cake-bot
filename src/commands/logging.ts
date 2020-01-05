import Medusa from 'medusajs';
import { TextChannel } from 'discord.js';

import { Command, CommandFn } from '../interfaces';
import { DB } from '../database';
import { client } from '..';
import { deleteAfterDelay } from '../messages';
import { Log } from '../logging';
import { emoji } from '../emoji';

const CHANNEL_REGEX = /<#(\d+)>/;

const setLogChannel: CommandFn = async (params, msg) => {
  if (params.length < 1) {
    return;
  }

  const serverId = msg.guild.id;

  if (params[0] === 'disable') {
    Log.red(
      'Logging disabled',
      'Nothing will be logged in this server in future.',
      serverId
    );
    await DB.deletePath(`/logging/${serverId}`);
    await Medusa.put(`logging.${serverId}`, null, 86400 * 1000);
    const sentMessage = await msg.channel.send(
      `${emoji.success} Logging disabled for this server.`
    );
    deleteAfterDelay(msg, sentMessage);
  }

  const maybeChannel = params[0];
  const match = maybeChannel.match(CHANNEL_REGEX);
  const channelId = !!match ? match[1] : undefined;

  const channel = client.channels.get(channelId || '') as TextChannel;
  if (!channel) {
    const sentMessage = await msg.channel.send(
      `${emoji.error} I couldn't find that channel.`
    );
    deleteAfterDelay(msg, sentMessage);
  }

  await DB.setPath(`/logging/${serverId}`, channelId);
  await Medusa.put(`logging.${serverId}`, channelId, 86400 * 1000);
  Log.green(
    'Logging enabled',
    `Logs will be sent to ${params[0]} for this server.`,
    serverId
  );
  const sentMessage = await msg.channel.send(
    `${emoji.success} Logging enabled in ${params[0]} for this server.`
  );
  deleteAfterDelay(msg, sentMessage);
};

export const logging: Command = {
  params: ['#channel'],
  description:
    'Enable logging in the specified channel, e.g. "log #logging", or disable logging using "log disable".',
  fn: setLogChannel,
  requiresMod: true
};
