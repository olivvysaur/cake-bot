import { Message } from 'discord.js';
import { RegexCommand } from '../interfaces';
import { brr } from './brr';

export const REGEX_COMMANDS: RegexCommand[] = [brr];

export const runRegexCommands = (msg: Message) => {
  REGEX_COMMANDS.forEach((command) => {
    if (msg.content.match(command.trigger)) {
      command.fn(msg);
    }
  });
};
