import { Command, CommandFn } from '../interfaces';
import { COMMANDS } from './index';
import { RichEmbed } from 'discord.js';
import { DB } from '../database';

const displayHelp: CommandFn = async (params, msg) => {
  const embed = new RichEmbed();

  let isMod = true;

  if (msg.member && msg.guild) {
    const userRoles = msg.member.roles;
    const modRoles = await DB.getArrayAtPath(`modRoles/${msg.guild.id}`);
    isMod = !!modRoles.length
      ? !!userRoles.find((role) => modRoles.includes(role.id))
      : true;
  }

  Object.keys(COMMANDS).forEach((key) => {
    const command = COMMANDS[key];

    if (command.hidden) {
      return;
    }

    if (command.requiresMod && !isMod) {
      return;
    }

    const params = command.params.map((param) => `<${param}>`).join(' ');
    embed.addField(
      `!cb ${key} ${params} ${command.requiresMod ? 'Ⓜ' : ''}`,
      COMMANDS[key].description,
      false
    );

    if (isMod) {
      embed.description = 'Commands marked with Ⓜ require mod privilege.';
    }
  });

  msg.channel.send(
    'These are all the commands I understand. Remember to use the !cb prefix at the start of your command.',
    embed
  );
};

export const help: Command = {
  params: [],
  description: 'Shows this help message.',
  fn: displayHelp,
  aliases: ['?'],
};
