import { Message, RichEmbed, User } from 'discord.js';
import Medusa from 'medusajs';

import { Log } from '../logging';
import { client } from '..';

interface AvatarUpdateRecord {
  count: number;
  logMessage?: Message;
}

const BATCH_THRESHOLD = 1000 * 60 * 15;

export const onAvatarUpdated = async (user: User) => {
  const userId = user.id;

  const commonServerIds = client.guilds
    .filter((guild) => !!guild.members.get(userId))
    .keyArray();

  commonServerIds.forEach(async (serverId) => {
    const existingRecord: AvatarUpdateRecord = await Medusa.get(
      `avatarUpdates.${serverId}.${userId}`,
      async (resolve: (value: any) => void) => {
        resolve({ count: 0, logMessage: undefined });
      },
      BATCH_THRESHOLD
    );

    const existingMessage = existingRecord.logMessage;

    const guildMember = client.guilds.get(serverId)?.members.get(userId);

    if (!existingMessage) {
      const sentMessage = await Log.send(
        'Avatar changed',
        `${user}`,
        serverId,
        {
          user: guildMember,
          thumbnailUrl: user.avatarURL,
        }
      );

      await Medusa.put(
        `avatarUpdates.${serverId}.${userId}`,
        {
          count: 1,
          logMessage: sentMessage,
        },
        BATCH_THRESHOLD
      );
    } else {
      const existingEmbed = existingMessage.embeds[0];
      const newEmbed = new RichEmbed();
      newEmbed.title = existingEmbed.title;
      newEmbed.author = existingEmbed.author;
      newEmbed.timestamp = new Date(existingEmbed.timestamp);
      newEmbed.footer = { text: existingEmbed.footer.text };

      newEmbed.thumbnail = { url: user.avatarURL };

      const newCount = existingRecord.count + 1;
      newEmbed.description = `${user}\nChanged ${newCount} times.`;

      const updatedMessage = await existingMessage.edit(newEmbed);
      await Medusa.put(
        `avatarUpdates.${serverId}.${userId}`,
        {
          count: newCount,
          logMessage: updatedMessage,
        },
        BATCH_THRESHOLD
      );
    }
  });
};
