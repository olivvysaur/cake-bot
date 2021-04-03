import { Message } from 'discord.js';

import { RegexCommand } from '../interfaces';

import { brr } from './brr';
import { tiktok } from './tiktok';
import { spotify } from './spotify';

export const REGEX_COMMANDS: RegexCommand[] = [brr, tiktok, spotify];

export const runRegexCommands = (msg: Message) => {
  REGEX_COMMANDS.forEach((command) => {
    if (msg.content.match(command.trigger)) {
      command.fn(msg);
    }
  });
};
