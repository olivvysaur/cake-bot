import { TextChannel } from 'discord.js';

import { Command, CommandFn } from '../interfaces';
import { deleteAfterDelay } from '../messages';
import { client } from '..';

const CHANNEL_REGEX = /<#(\d+)>/;

const breadifyMessage: CommandFn = async (params, msg) => {
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

  const text = !!channelId ? params.slice(1).join(' ') : params.join(' ');
  const breadifiedText = text
    .split('')
    .map(letter => {
      if (letter === ' ') {
        return '   ';
      } else {
        const emoji = client.emojis.find(
          emoji => emoji.name === `Bread${letter.toUpperCase()}`
        );
        return emoji || letter;
      }
    })
    .join('');

  const channelToSend = !!channelId ? channel : msg.channel;
  channelToSend.send(breadifiedText);
  return msg.delete();
};

export const breadify: Command = {
  description: 'Turns a message into bread.',
  fn: breadifyMessage,
  params: ['#channel', 'message'],
  hidden: true
};
