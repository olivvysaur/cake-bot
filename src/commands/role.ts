import { Message, RichEmbed } from 'discord.js';
import Color from 'color';

import { Command, CommandFn } from '../interfaces';

const DISCORD_BG_COLOUR = Color('#36393f');
const CONTRAST_THRESHOLD = 4.5;

const hexToRgb = (hex: string) => {
  var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(
        result[3],
        16
      )}`
    : null;
};

const roleInfo: CommandFn = async (params, msg) => {
  if (params.length < 1) {
    return;
  }

  const roleName = params.join(' ');

  const allRoles = msg.guild.roles;
  const role = allRoles.find(
    role => role.name.toLowerCase() === roleName.toLowerCase()
  );

  if (!role) {
    const sentMessage = await msg.channel.send("⚠️ I couldn't find that role.");
    setTimeout(() => {
      msg.delete();
      (sentMessage as Message).delete();
    }, 5000);
    return;
  }

  const { name, color, hexColor, members, createdAt } = role;

  const contrast = Color(color).contrast(DISCORD_BG_COLOUR);
  const accessibilityIndicator = contrast >= CONTRAST_THRESHOLD ? '✅' : '⚠️';

  const embed = new RichEmbed();
  embed.title = `Info about role ${name}`;
  embed.color = color;
  embed.addField('Hex', hexColor, true);
  embed.addField('RGB', hexToRgb(hexColor), true);
  embed.addField('People with this role', members.size, true);
  embed.addField(
    'Colour contrast',
    `${accessibilityIndicator} ${contrast.toFixed(2)}`,
    true
  );
  embed.footer = { text: 'Role created:' };
  embed.timestamp = createdAt;
  msg.channel.send(embed);
};

export const role: Command = {
  params: ['role name'],
  description: 'Shows information about a specific role.',
  hidden: true,
  fn: roleInfo
};
