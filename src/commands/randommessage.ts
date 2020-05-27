import { TextChannel, RichEmbed } from 'discord.js';

import { Command, CommandFn } from '../interfaces';
import { emoji } from '../emoji';
import { client } from '..';
import { random } from '../random';

const CHANNEL_REGEX = /<#(\d+)>/;

const getRandomMessage: CommandFn = async (params, msg) => {
  if (params.length < 1) {
    return msg.channel.send(
      `${emoji.error} I need to know which channel to get messages from.`
    );
  }

  const match = params[0].match(CHANNEL_REGEX);
  const channelId = !!match ? match[1] : '';

  const channel = client.channels.get(channelId) as TextChannel;
  if (!channel) {
    return msg.channel.send(
      `${emoji.error} Please specify a channel using the # syntax.`
    );
  }

  const messageIDs: string[] = [];

  let fetchedMessages;
  let earliestMessage;
  do {
    fetchedMessages = await channel.fetchMessages({ before: earliestMessage });
    if (!fetchedMessages || !fetchedMessages.size) {
      break;
    }
    messageIDs.concat(fetchedMessages.map((message) => message.id));
  } while (fetchedMessages && fetchedMessages.size);

  const chosenIndex = random(messageIDs.length);
  const chosenMessage = await channel.fetchMessage(messageIDs[chosenIndex]);

  const embed = chosenMessage.embeds[0];
  const newEmbed = new RichEmbed(embed);

  return msg.channel.send(chosenMessage.content, newEmbed);
};

export const randommessage: Command = {
  description: 'Displays a random message from a given channel.',
  params: ['channel'],
  fn: getRandomMessage,
  hidden: true,
};
