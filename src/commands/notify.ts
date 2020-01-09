import { Command, CommandFn } from '../interfaces';
import { Message, MessageReaction } from 'discord.js';

import {
  addOnlineNotification,
  getOnlineNotificationBetweenUsers,
  DB
} from '../database';
import { findUser } from '../users';
import { emoji } from '../emoji';

const setupNotification: CommandFn = async (params, msg) => {
  if (params.length < 1) {
    const sentMessage = await msg.channel.send(
      `${emoji.error} I need to know who to notify.`
    );
    setTimeout(() => {
      msg.delete();
      (sentMessage as Message).delete();
    }, 5000);
    return;
  }

  const joinedParams = params.join(' ');
  const endOfUsername = joinedParams.indexOf('--');
  const usernameQuery = joinedParams
    .slice(0, endOfUsername === -1 ? undefined : endOfUsername)
    .trim();

  const serverId = msg.guild.id;
  const foundUser = findUser(usernameQuery, serverId);

  if (!foundUser) {
    const sentMessage = await msg.channel.send(
      `${emoji.error} I can't find a user named "${usernameQuery}".`
    );
    setTimeout(() => {
      msg.delete();
      (sentMessage as Message).delete();
    }, 5000);
    return;
  }

  const receiverId = foundUser.id;
  const senderId = msg.member.user.id;
  const senderName = msg.member.displayName;
  const link = msg.url;

  const dndUsers = await DB.getArrayAtPath('dnd');
  if (dndUsers.includes(receiverId)) {
    const sentMessage = await msg.channel.send(
      `${emoji.error} That person cannot be notified at the moment.`
    );
    setTimeout(() => {
      msg.delete();
      (sentMessage as Message).delete();
    }, 5000);
    return;
  }

  const existingNotification = await getOnlineNotificationBetweenUsers(
    receiverId,
    senderId
  );
  if (!!existingNotification) {
    const sentMessage = await msg.channel.send(
      `${emoji.error} You already have a pending notification for that person.`
    );
    setTimeout(() => {
      msg.delete();
      (sentMessage as Message).delete();
    }, 5000);
    return;
  }

  await addOnlineNotification(receiverId, senderId, link, senderName);

  const cancelEmoji = emoji.CancelPing;
  if (cancelEmoji) {
    msg.react(cancelEmoji);
  } else {
    const sentMessage = await msg.channel.send(
      `${emoji.success} Got it! Next time ${foundUser.displayName} is active I'll send a notification.`
    );
    setTimeout(() => {
      (sentMessage as Message).delete();
    }, 5000);
  }
  return;
};

export const cancelPing = async (reaction: MessageReaction, userId: string) => {
  const { message } = reaction;
  const {
    author: { id: senderId },
    url
  } = message;

  if (userId === senderId) {
    const allNotifications = (await DB.getPath('onlineNotifications')) || {};
    Object.keys(allNotifications).forEach(receiver => {
      const notificationsForReceiver = allNotifications[receiver];
      const notificationFromSender = notificationsForReceiver[senderId];
      if (!!notificationFromSender && notificationFromSender.url === url) {
        DB.deletePath(`onlineNotifications/${receiver}/${senderId}`);
        message.clearReactions();
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
  fn: setupNotification
};
