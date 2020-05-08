import { Command, CommandFn } from '../interfaces';
import { TextChannel, Message, RichEmbed } from 'discord.js';
import { client } from '..';
import moment = require('moment');
import { pluralise } from '../strings';

const drawProgressBar = (percentage: number) => {
  const leftEdge = '▕';
  const rightEdge = '▏';
  const characters = ['', '▏', '▎', '▍', '▌', '▋', '▊', '▉', '█'];

  // Marker for left edge.
  let bar = leftEdge;

  // Count how many full blocks are required and add them.
  const fullBlocks = Math.floor(percentage / 10);
  for (var i = 0; i < fullBlocks; i++) {
    bar += characters[8];
  }

  // Add the partial segment at the end. The unicode blocks go down to eigths
  // so split the partial block into (10 ÷ 8) pieces, each size 1.25.
  const partial = Math.floor((percentage - fullBlocks * 10) / 1.25);
  bar += characters[partial];

  // Add empty spaces where there are no blocks.
  while (bar.length < 11) {
    bar += rightEdge;
  }

  // Add the marker for the right edge.
  bar += rightEdge;

  return bar;
};

const EMOJI_REGEX = /<a?:\w+:\d+>/g;

const calculateEmojiStats: CommandFn = async (params, msg) => {
  const channels = msg.guild.channels
    .filter((channel) => channel.type === 'text')
    .filter((channel) => {
      const permissions = channel.permissionsFor(client.user);
      return permissions ? permissions.has('READ_MESSAGES') : false;
    });

  const numChannels = channels.size;

  const serverEmojis = msg.guild.emojis;
  const serverEmojiNames = serverEmojis.map((emoji) => emoji.toString());

  const embed = new RichEmbed();
  embed.title = 'Emoji stats';
  embed.description = '';
  embed.addField(
    'Loading messages...',
    `Fetching from ${pluralise(numChannels, 'channel')}`
  );
  const resultMessage = await msg.channel.send(embed);

  let numMessages = 0;
  const emojiCounts: { [name: string]: number } = {};

  await Promise.all(
    channels.map(async (channel) => {
      let fetchedMessages;
      let earliestMessage;
      do {
        fetchedMessages = await (channel as TextChannel).fetchMessages({
          before: earliestMessage,
        });
        if (!fetchedMessages || !fetchedMessages.size) {
          break;
        }

        fetchedMessages
          .filter((message) => !message.author.bot)
          .forEach((message) => {
            numMessages += 1;
            let match;
            do {
              match = EMOJI_REGEX.exec(message.content);
              if (match) {
                const emoji = match[0];
                if (serverEmojiNames.includes(emoji)) {
                  const existingCount = emojiCounts[emoji] || 0;
                  emojiCounts[emoji] = existingCount + 1;
                }
              }
            } while (match);
          });

        earliestMessage = fetchedMessages.last().id;
      } while (fetchedMessages && fetchedMessages.size);
    })
  );

  const serverEmojiCounts = serverEmojis.map((emoji) => ({
    key: emoji.toString(),
    count: emojiCounts[emoji.toString()] || 0,
  }));

  const ranking = serverEmojiCounts.sort((a, b) =>
    a.count < b.count ? 1 : a.count > b.count ? -1 : 0
  );

  const top = ranking
    .slice(0, 10)
    .map((item) => `${item.key} - ${pluralise(item.count, 'time')}`)
    .join('\n');

  const bottom = ranking
    .slice(-10)
    .reverse()
    .map((item) => `${item.key} - ${pluralise(item.count, 'time')}`)
    .join('\n');

  const resultsEmbed = new RichEmbed();
  resultsEmbed.title = 'Emoji stats';
  resultsEmbed.addField('Top 10', top, true);
  resultsEmbed.addField('Bottom 10', bottom, true);
  resultsEmbed.footer = {
    text: `Checked ${pluralise(numMessages, 'message')} in ${pluralise(
      numChannels,
      'channel'
    )}`,
  };
  (resultMessage as Message).edit(resultsEmbed);

  const requester = msg.author;
  msg.channel.send(`${requester}, the emoji stats are ready!`);
};

export const emoji: Command = {
  description: 'Displays a ranking of emojis used in the server.',
  params: [],
  fn: calculateEmojiStats,
  requiresMod: true,
};
