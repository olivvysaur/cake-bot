import { Message } from 'discord.js';

import { setupNotification } from '../commands/notify';

const notifyRegexWithoutSpaces = /!!([^\s\(,\.]+)/g;
const notifyRegexWithSpaces = /!!\(([\S ]+)\)/g;

export const onMessageReceived = async (msg: Message) => {
  const matches = [];

  let match;
  while ((match = notifyRegexWithoutSpaces.exec(msg.content)) !== null) {
    matches.push(match[1]);
  }
  while ((match = notifyRegexWithSpaces.exec(msg.content)) !== null) {
    matches.push(match[1]);
  }

  matches.forEach((match) => {
    setupNotification(match, msg, { skipErrors: true });
  });
};
