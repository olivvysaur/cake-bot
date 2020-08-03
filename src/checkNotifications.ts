import Medusa from 'medusajs';
import { TextChannel, RichEmbed } from 'discord.js';

import { client } from './';
import { getOnlineNotifications, deleteOnlineNotifications } from './database';
import { pluralise } from './strings';

const CACHE_LENGTH = 1000 * 60 * 10;

export const checkNotifications = async (userId: string) => {
  const notifications = await Medusa.get(
    `onlineNotifications.${userId}`,
    async (resolve: (value: any) => void) => {
      const retrieved = await getOnlineNotifications(userId);
      await deleteOnlineNotifications(userId);
      resolve(retrieved);
    },
    CACHE_LENGTH
  );

  const senders = !!notifications ? Object.keys(notifications) : [];

  if (!notifications || !senders.length) {
    return;
  }

  // Empty the value in the cache to avoid re-sending cached notifications.
  await Medusa.put(
    `onlineNotifications.${userId}`,
    (resolve: (value: any) => void) => {
      resolve(null);
    },
    CACHE_LENGTH
  );

  const count = senders.length;

  const embed = new RichEmbed();
  embed.title = count === 1 ? 'Notification' : 'Notifications';
  embed.description = `${pluralise(
    count,
    'person',
    'people'
  )} left a non-urgent ping for you while you were inactive.`;

  senders
    .map((senderId) => ({
      senderId,
      ...notifications[senderId],
    }))
    .forEach(async (notification) => {
      const { senderId, serverId, channelId, url } = notification;

      const channel = client.channels.get(channelId) as TextChannel;
      const channelName = channel?.name;

      const server = client.guilds.get(serverId) || channel?.guild;
      const serverName = server?.name;

      const sender = await server?.fetchMember(senderId);
      const senderName = sender?.displayName || 'Unknown user';

      const channelPortion = channelName ? `, #${channelName}` : '';
      const serverPortion = serverName ? ` (${serverName})` : '';

      embed.addField(`${senderName}${channelPortion}${serverPortion}`, url);
    });

  const receiver = await client.fetchUser(userId);
  await receiver.createDM();
  receiver.dmChannel.send(embed);
};
