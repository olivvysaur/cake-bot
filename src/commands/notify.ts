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

  const serverId = msg.guild.id;
  const enteredUsername = params[0];
  const foundUser = findUser(enteredUsername, serverId);

  if (!foundUser) {
    const sentMessage = await msg.channel.send(
      `⚠️ I can't find a user named "${enteredUsername}".`
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
  msg.react('✅');
};

export const notify: Command = {
  params: ['username'],
  description: `Notifies the specified person next time they're online with a link to your message. E.g. "notify valentine"`,
  fn: setupNotification
};
