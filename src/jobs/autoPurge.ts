import { TextChannel, Message } from 'discord.js';

import { DB } from '../database';
import { client } from '..';
import moment from 'moment';
import { pluralise } from '../strings';
import { Log } from '../logging';

const getMessagesToPurge = async (channel: TextChannel, minAge: number) => {
  const threshold = moment().subtract(minAge, 'days');
  const thresholdTimestamp = threshold.valueOf();
  console.log(
    `[autopurge] Finding messages in channel ${
      channel.id
    } older than ${thresholdTimestamp} (${threshold.toISOString()})`
  );

  let messagesToPurge: Message[] = [];
  let fetchedMessages;
  let earliestMessage;

  do {
    fetchedMessages = await (channel as TextChannel).fetchMessages({
      before: earliestMessage,
    });
    if (!fetchedMessages || !fetchedMessages.size) {
      break;
    }

    const matchingFetchedMessages = fetchedMessages.filter(
      (message) => message.createdTimestamp <= thresholdTimestamp
    );

    messagesToPurge = messagesToPurge.concat(matchingFetchedMessages.array());

    earliestMessage = fetchedMessages.last().id;
  } while (fetchedMessages && fetchedMessages.size);

  return messagesToPurge;
};

export const autoPurge = async () => {
  const servers = await DB.getPath('autoPurge');

  Object.keys(servers).forEach(async (serverId) => {
    const results: { [name: string]: number } = {};

    const configs = servers[serverId];
    await Promise.all(
      Object.keys(configs).map(async (channelId) => {
        const channel = client.channels.get(channelId);
        const minAge = configs[channelId];

        if (!channel) {
          console.log(
            `[autopurge] Auto purge failed for missing channel ${channelId}`
          );
          return;
        }

        const textChannel = channel as TextChannel;

        const messagesToPurge = await getMessagesToPurge(textChannel, minAge);

        console.log(
          `[autopurge] Found ${pluralise(
            messagesToPurge.length,
            'message'
          )} to purge in channel ${channelId}`
        );

        if (messagesToPurge.length === 0) {
          return;
        }

        await Promise.all(
          messagesToPurge.map(async (message) => {
            await message.delete();
          })
        );

        console.log(`[autopurge] Purged messages in channel ${channelId}`);
        results[textChannel.name] = messagesToPurge.length;
      })
    );

    const resultsMessage = Object.keys(results)
      .map(
        (channelName) =>
          `#${channelName}: ${pluralise(results[channelName], 'message')}`
      )
      .join('\n');

    if (resultsMessage.length === 0) {
      return;
    }

    Log.red('Auto purge complete', resultsMessage, serverId);
  });
};
