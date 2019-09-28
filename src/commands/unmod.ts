import { Command, CommandFn } from '../interfaces';
import { GuildMember, RichEmbed } from 'discord.js';
import { client } from '..';
import { DB } from '../database';

const removeMod: CommandFn = async (params, msg) => {
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

  const modRoleArray = (await DB.getPath(`modRoles/${serverId}`)) || [];
  const matchedKey = Object.keys(modRoleArray).find(
    key => modRoleArray[key] === matchedRole.id
  );

  if (matchedKey) {
    await DB.deletePath(`modRoles/${serverId}/${matchedKey}`);
  }

  const embed = new RichEmbed();
  embed.title = 'Mod role removed';
  embed.description = `${matchedRole} is no longer a mod role.`;
  msg.channel.send(embed);
};

export const unmod: Command = {
  params: ['role'],
  description: 'Removes the specified role as a mod, e.g. "unmod admin".',
  fn: removeMod,
  requiresMod: true
};
