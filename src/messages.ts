import { Message } from 'discord.js';

export const deleteAfterDelay = (...messages: (Message | Message[])[]) => {
  setTimeout(() => {
    messages.forEach(message => (message as Message).delete());
  }, 5000);
};
