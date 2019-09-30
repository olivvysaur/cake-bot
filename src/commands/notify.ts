import { Command, CommandFn } from '../interfaces';
import { Message } from 'discord.js';
import {
  addOnlineNotification,
  getOnlineNotificationBetweenUsers
} from '../database';
import { findUser, getUsername } from '../users';

const setupNotification: CommandFn = async (params, msg) => {
  if (params.length < 1) {
    const sentMessage = await msg.channel.send(
      '⚠️ I need to know who to notify.'
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
      `⚠️ I can't find a user named "${usernameQuery}".`
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

  const existingNotification = await getOnlineNotificationBetweenUsers(
    receiverId,
    senderId
  );
  if (!!existingNotification) {
    const sentMessage = await msg.channel.send(
      '⚠️ You already have a pending notification for that person.'
    );
    setTimeout(() => {
      msg.delete();
      (sentMessage as Message).delete();
    }, 5000);
    return;
  }

  await addOnlineNotification(receiverId, senderId, link, senderName);
  const sentMessage = await msg.channel.send(
    `✅ Got it! Next time ${foundUser.displayName} is active I'll send a notification.`
  );
  setTimeout(() => {
    (sentMessage as Message).delete();
  }, 5000);
  return;
};

export const notify: Command = {
  params: ['username'],
  description: `Notifies the specified person next time they're online with a link to your message, e.g. "notify valentine". Add a comment by putting two dashes after the person's name, e.g. "notify valentine -- check this out!".`,
  fn: setupNotification
};
