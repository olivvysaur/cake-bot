import Medusa from 'medusajs';

import { DB } from './database';
import { Message } from 'discord.js';
import { PREFIX } from './constants';
import { Shortcut } from './interfaces';
import { runCommand } from '.';

const CACHE_LENGTH = 86400 * 1000;

export const getShortcuts = async (serverId: string) => {
  const shortcuts = await Medusa.get(
    `shortcuts.${serverId}`,
    async (resolve: (value: any) => void) => {
      const retrieved = await DB.getArrayAtPath(`shortcuts/${serverId}`);
      resolve(retrieved);
    },
    CACHE_LENGTH
  );
  return shortcuts;
};

export const checkShortcuts = async (message: Message) => {
  const serverId = message.guild.id;

  const shortcuts: Shortcut[] = await getShortcuts(serverId);
  if (!shortcuts) {
    return;
  }

  const text = message.content.replace(PREFIX, '');
  const matched = shortcuts.find(shortcut => shortcut.trigger === text);
  if (matched) {
    message.content = matched.command;
    runCommand(message);
  }
};
