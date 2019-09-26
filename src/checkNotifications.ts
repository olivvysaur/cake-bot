import Medusa from 'medusajs';
import { getOnlineNotifications, deleteOnlineNotifications } from './database';
import { client } from '.';

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
  const introText = `${count} ${
    count === 1 ? 'person' : 'people'
  } left a non-urgent ping for you while you were inactive:\n\n`;

  const message = senders
    .map(senderId => ({
      senderName: notifications[senderId].senderName,
      url: notifications[senderId].url
    }))
    .reduce((dmText, notification) => {
      const entry = `${notification.senderName}\n${notification.url}`;
      return `${dmText}${entry}\n\n`;
    }, introText);

  const receiver = await client.fetchUser(userId);
  await receiver.createDM();
  receiver.dmChannel.send(message);
};
