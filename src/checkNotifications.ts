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

  // Empty the value in the cache to avoid re-sending cached notifications.
  // This also refreshes the cache period whenever someone speaks so that
  // they don't get pinged while active.
  await Medusa.put(
    `onlineNotifications.${userId}`,
    (resolve: (value: any) => void) => {
      resolve(null);
    },
    CACHE_LENGTH
  );

  const senders = !!notifications ? Object.keys(notifications) : [];

  if (!notifications || !senders.length) {
    return;
  }

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
      senderName: notifications[senderId].senderName,
      url: notifications[senderId].url,
    }))
    .forEach((notification) => {
      embed.addField(notification.senderName, notification.url);
    });

  const receiver = await client.fetchUser(userId);
  await receiver.createDM();
  receiver.dmChannel.send(embed);
};
