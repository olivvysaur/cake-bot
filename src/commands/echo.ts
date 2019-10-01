import { TextChannel } from 'discord.js';

import { Command, CommandFn } from '../interfaces';
import { deleteAfterDelay } from '../messages';
import { client } from '..';

const CHANNEL_REGEX = /<#(\d+)>/;

const doEcho: CommandFn = async (params, msg) => {
  if (params.length < 1) {
    return;
  }

  const maybeChannel = params[0];
  const match = maybeChannel.match(CHANNEL_REGEX);
  const channelId = !!match ? match[1] : undefined;

  const channel = client.channels.get(channelId || '') as TextChannel;
  if (!!channelId && !channel) {
    const sentMessage = await msg.channel.send(
      "⚠️ I couldn't find that channel."
    );
    deleteAfterDelay(msg, sentMessage);
  }

  const textToSend = !!channelId ? params.slice(1).join(' ') : params.join(' ');
  const channelToSend = !!channelId ? channel : msg.channel;
  channelToSend.send(textToSend);
  return msg.delete();
};

export const echo: Command = {
  params: ['channel', 'text'],
  description:
    'Repeat the specified text in the specified channel, e.g. "echo #general I love you".',
  hidden: true,
  fn: doEcho
};
