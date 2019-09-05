import { Command, CommandFn } from '../interfaces';
import { COMMANDS } from './index';
import { RichEmbed } from 'discord.js';

const displayHelp: CommandFn = (params, msg) => {
  const embed = new RichEmbed();

  Object.keys(COMMANDS).forEach(key => {
    const command = COMMANDS[key];
    const params = command.params.map(param => `[${param}]`).join(' ');
    embed.addField(`${key} ${params}`, COMMANDS[key].description, false);
  });

  msg.channel.send(
    'These are all the commands Cake Bot uses. Remember to @mention Cake Bot at the start of your command.',
    embed
  );
};

export const help: Command = {
  params: [],
  description: 'Shows this help message.',
  fn: displayHelp
};
