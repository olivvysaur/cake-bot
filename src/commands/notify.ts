import { Command, CommandFn } from '../interfaces';
import { Message, MessageReaction, GuildMember } from 'discord.js';

import {
  addOnlineNotification,
  getOnlineNotificationBetweenUsers,
  DB,
} from '../database';
import { findUser } from '../users';
import { emoji } from '../emoji';
import { deleteAfterDelay } from '../messages';

interface SetupNotificationOptions {
  skipErrors?: boolean;
}

export const setupNotification = async (
  usernameQuery: string,
  msg: Message,
  options?: SetupNotificationOptions
) => {
  const serverId = msg.guild.id;
  const foundUser = findUser(usernameQuery, serverId);

  const { skipErrors = false } = options || {};

  if (!foundUser) {
    if (skipErrors) {
      return;
    }

    const sentMessage = await msg.channel.send(
      `${emoji.error} I can't find a user named "${usernameQuery}".`
    );
    deleteAfterDelay(sentMessage);
    return;
  }

  const receiverId = foundUser.id;
  const receiverName = foundUser.displayName;
  const senderId = msg.member.user.id;
  const senderName = msg.member.displayName;
  const link = msg.url;

  if (receiverId === senderId) {
    const sentMessage = await msg.channel.send(
      `${emoji.error} You cannot notify yourself.`
    );
    deleteAfterDelay(sentMessage);
    return;
  }

  const dndUsers = await DB.getArrayAtPath('dnd');
  if (dndUsers.includes(receiverId)) {
    const sentMessage = await msg.channel.send(
      `${emoji.error} ${receiverName} cannot be notified at the moment.`
    );
    deleteAfterDelay(sentMessage);
    return;
  }

  const existingNotification = await getOnlineNotificationBetweenUsers(
    receiverId,
    senderId
  );
  if (!!existingNotification) {
    const sentMessage = await msg.channel.send(
      `${emoji.error} You already have a pending notification for ${receiverName}.`
    );
    deleteAfterDelay(sentMessage);
    return;
  }

  await addOnlineNotification(receiverId, senderId, link, senderName);

  const cancelEmoji = emoji.CancelPing;
  if (cancelEmoji) {
    msg.react(cancelEmoji);
  } else {
    const sentMessage = await msg.channel.send(
      `${emoji.success} Got it! Next time ${receiverName} is active I'll send a notification.`
    );
    deleteAfterDelay(sentMessage);
  }
};

const setupNotificationFromMessage: CommandFn = async (params, msg) => {
  if (params.length < 1) {
    const sentMessage = await msg.channel.send(
      `${emoji.error} I need to know who to notify.`
    );
    deleteAfterDelay(sentMessage);
    return;
  }

  const joinedParams = params.join(' ');
  const endOfUsername = joinedParams.indexOf('--');
  const usernameQuery = joinedParams
    .slice(0, endOfUsername === -1 ? undefined : endOfUsername)
    .trim();

  return setupNotification(usernameQuery, msg);
};

export const cancelPing = async (reaction: MessageReaction, userId: string) => {
  const { message } = reaction;
  const {
    author: { id: senderId },
    url,
  } = message;

  if (userId === senderId) {
    const allNotifications = (await DB.getPath('onlineNotifications')) || {};

    Object.keys(allNotifications).forEach((receiver) => {
      const notificationsForReceiver = allNotifications[receiver];
      const notificationFromSender = notificationsForReceiver[senderId];
      if (!!notificationFromSender && notificationFromSender.url === url) {
        DB.deletePath(`onlineNotifications/${receiver}/${senderId}`);
      }
    });
    return;
  }

  const notification = await getOnlineNotificationBetweenUsers(
    userId,
    senderId
  );
  if (!!notification && notification.url === url) {
    DB.deletePath(`onlineNotifications/${userId}/${senderId}`);
    message.clearReactions();
  }
};

export const notify: Command = {
  params: ['username'],
  description: `Notifies the specified person next time they're online with a link to your message, e.g. "notify valentine". Add a comment by putting two dashes after the person's name, e.g. "notify valentine -- check this out!".`,
  fn: setupNotificationFromMessage,
};
