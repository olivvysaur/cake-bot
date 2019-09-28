import { Command, CommandFn } from '../interfaces';
import { GuildMember, RichEmbed } from 'discord.js';
import { client } from '..';
import { DB } from '../database';

const addMod: CommandFn = async (params, msg) => {
  if (params.length < 1) {
    return;
  }

  const server = msg.guild;
  const serverId = server.id;

  const roleName = params.join(' ');
  const matchedRole = server.roles.find(
    role => role.name.toLowerCase() === roleName.toLowerCase()
  );
  if (!matchedRole) {
    return msg.channel.send(`⚠️ I couldn't find a role named ${roleName}.`);
  }

  const existingModRoles = await DB.getArrayAtPath(`modRoles/${serverId}`);
  if (!existingModRoles.includes(matchedRole.id)) {
    await DB.pushAtPath(`modRoles/${serverId}`, matchedRole.id);
  }

  const embed = new RichEmbed();
  embed.title = 'Mod role added';
  embed.description = `${matchedRole} is now a mod role.`;
  msg.channel.send(embed);
};

export const mod: Command = {
  params: ['role'],
  description: 'Adds the specified role as a mod, e.g. "mod admin".',
  fn: addMod,
  requiresMod: true
};
