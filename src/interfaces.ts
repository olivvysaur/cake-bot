import Discord from 'discord.js';

export type CommandFn = (params: string[], msg: Discord.Message) => void;

export interface Command {
  params: string[];
  description: string;
  fn: CommandFn;
  hidden?: boolean;
  aliases?: string[];
  requiresMod?: boolean;
}

export interface RegexCommand {
  trigger: RegExp;
  fn: (msg: Discord.Message) => void;
}

export interface Shortcut {
  trigger: string;
  command: string;
}
