import {
  GuildMember,
  RichEmbed,
  Attachment,
  TextChannel,
  Message,
  Util
} from 'discord.js';
import { createCanvas } from 'canvas';
import Color from 'color';

import { Command, CommandFn } from '../interfaces';
import { client } from '..';
import { DB } from '../database';
import { deleteAfterDelay } from '../messages';
import { Log } from '../logging';
import { notUndefined } from '../notUndefined';
import { pluralise } from '../strings';
import { DISCORD_BG_COLOUR, CONTRAST_THRESHOLD, PREFIX } from '../constants';
import { emoji } from '../emoji';
import { random } from '../random';

interface Colour {
  name: string;
  hex: string;
  role: string;
}

const setColour = async (
  serverId: string,
  user: GuildMember,
  colour: number
) => {
  const server = client.guilds.get(serverId);
  if (!server) {
    return `${emoji.error} Something went wrong.\n\`Invalid server id ${serverId}\``;
  }

  const serverColours: Colour[] = await DB.getArrayAtPath(
    `colours/${serverId}`
  );

  if (colour > serverColours.length) {
    return `${emoji.error} No colour exists with number ${colour}.`;
  }

  const serverColourRoles = serverColours.map(colour => colour.role);
  const chosenColor = serverColours[colour - 1];

  const existingColourRoles = user.roles.filter(role =>
    serverColourRoles.includes(role.id)
  );
  await user.removeRoles(existingColourRoles);

  if (colour === 0) {
    const embed = new RichEmbed();
    embed.title = 'Colour removed';
    embed.description = `${user}, your colour has been removed.`;
    return embed;
  }

  const roleId = chosenColor.role;
  await user.addRole(roleId);

  Log.send(
    'Colour changed',
    `Changed to #${colour} (**${chosenColor.name}**).`,
    serverId,
    { user, color: chosenColor.hex }
  );

  const embed = new RichEmbed();
  embed.setColor(chosenColor.hex);
  embed.title = 'Colour changed';
  embed.description = `${user}, your colour is now **${chosenColor.name}**.`;
  return embed;
};

const setRandomColour = async (serverId: string, user: GuildMember) => {
  const server = client.guilds.get(serverId);
  if (!server) {
    return `${emoji.error} Something went wrong.\n\`Invalid server id ${serverId}\``;
  }

  const serverColours: Colour[] = await DB.getArrayAtPath(
    `colours/${serverId}`
  );

  const colour = random(serverColours.length) + 1;

  const serverColourRoles = serverColours.map(colour => colour.role);
  const chosenColor = serverColours[colour - 1];

  const existingColourRoles = user.roles.filter(role =>
    serverColourRoles.includes(role.id)
  );
  await user.removeRoles(existingColourRoles);

  const roleId = chosenColor.role;
  await user.addRole(roleId);

  Log.send(
    'Colour changed',
    `Changed to #${colour} (**${chosenColor.name}**).`,
    serverId,
    { user, color: chosenColor.hex }
  );

  const embed = new RichEmbed();
  embed.setColor(chosenColor.hex);
  embed.title = 'Colour changed';
  embed.description = `${user}, your colour is now **${chosenColor.name}**.`;
  return embed;
};

const listColours = async (serverId: string) => {
  const server = client.guilds.get(serverId);
  if (!server) {
    return `${emoji.error} Something went wrong.\n\`Invalid server id ${serverId}\``;
  }

  const serverColours: Colour[] = await DB.getArrayAtPath(
    `colours/${serverId}`
  );
  if (!serverColours.length) {
    return `${emoji.error} No colours have been set up.`;
  }

  const font = 'bold 48px sans-serif';
  const numberOfColumns = 2;

  const numberOfColours = serverColours.length;
  const longestName = serverColours.reduce(
    (longest, colour, index) => {
      const column = index % numberOfColumns;
      const updated = [...longest];
      if (colour.name.length > longest[column].length) {
        updated[column] = colour.name;
      }
      return updated;
    },
    ['', '', '']
  );

  const fakeCanvas = createCanvas(100, 100);
  const fakeCtx = fakeCanvas.getContext('2d');
  fakeCtx.font = font;

  const longestWidths = longestName.map(
    longest => fakeCtx.measureText(`999. ${longest}`).width
  );
  const columnWidths = longestWidths.map(width => width);
  const startPositions = columnWidths.map((width, index) => {
    const previousColumns = columnWidths.slice(0, index);
    return previousColumns.reduce((acc, val) => acc + val, 0);
  });

  const canvasWidth = columnWidths.reduce((acc, val) => acc + val, 0);

  const canvas = createCanvas(
    canvasWidth,
    60 * Math.ceil(numberOfColours / numberOfColumns)
  );
  const ctx = canvas.getContext('2d');

  ctx.font = font;
  serverColours.forEach((colour, index) => {
    const { name, hex } = colour;
    const column = index % numberOfColumns;
    const row = Math.floor(index / numberOfColumns);

    ctx.fillStyle = `#${hex}`;
    ctx.fillText(
      `${index + 1}. ${name}`,
      startPositions[column],
      row * 60 + 48
    );
  });

  return new Attachment(canvas.toBuffer(), 'color_list.png');
};

const pinColourList = async (serverId: string, channel: TextChannel) => {
  const list = await listColours(serverId);
  const sentMessage = await channel.send(list);

  if (!(list instanceof Attachment)) {
    return;
  }

  const pins = await channel.fetchPinnedMessages();
  pins
    .filter(pin => pin.member.id === client.user.id)
    .forEach(pin => pin.unpin());

  (sentMessage as Message).pin();
};

const createColour = async (
  serverId: string,
  hex: string,
  name: string,
  creator: GuildMember
) => {
  const server = client.guilds.get(serverId);
  if (!server) {
    return `${emoji.error} Something went wrong.\n\`Invalid server id ${serverId}\``;
  }

  const serverColours: Colour[] = await DB.getArrayAtPath(
    `colours/${serverId}`
  );
  const colourCount = !!serverColours ? serverColours.length : 0;

  const botRolePosition = server.member(client.user).highestRole.position;
  const newRolePosition = botRolePosition - 1;

  const colourRole = await server.createRole({
    name,
    color: hex,
    position: newRolePosition
  });

  const colourData: Colour = {
    name,
    hex,
    role: colourRole.id
  };
  await DB.pushAtPath(`colours/${serverId}`, colourData);

  const newColourNumber = colourCount + 1;

  Log.send(
    'Colour created',
    `**${name}** created as #${newColourNumber} with hex **#${hex}**.`,
    serverId,
    { user: creator, color: hex }
  );

  const embed = new RichEmbed();
  embed.setColor(hex);
  embed.title = 'Colour created';
  embed.description = `Successfully created colour **${name}** (#${newColourNumber}).`;
  return embed;
};

const renameColour = async (
  serverId: string,
  colour: number,
  name: string,
  user: GuildMember
) => {
  const server = client.guilds.get(serverId);
  if (!server) {
    return `${emoji.error} Something went wrong.\n\`Invalid server id ${serverId}\``;
  }

  const serverColours: { [key: string]: Colour } = await DB.getPath(
    `colours/${serverId}`
  );
  const keys = Object.keys(serverColours);

  if (colour > keys.length) {
    return `${emoji.error} No colour exists with number ${colour}.`;
  }

  const chosenKey = keys[colour - 1];
  const chosenColor = serverColours[chosenKey];

  const oldName = chosenColor.name;
  const role = server.roles.get(chosenColor.role);
  if (role) {
    await role.setName(name);
  }

  const updatedColor = {
    ...chosenColor,
    name
  };
  await DB.setPath(`colours/${serverId}/${chosenKey}`, updatedColor);

  Log.send(
    'Colour renamed',
    `**${oldName}** (#${colour}) renamed to **${name}**.`,
    serverId,
    { user, color: chosenColor.hex }
  );

  const embed = new RichEmbed();
  embed.setColor(chosenColor.hex);
  embed.title = 'Colour renamed';
  embed.description = `Successfully renamed colour **${oldName}** to **${name}**.`;
  return embed;
};

const deleteColour = async (
  serverId: string,
  colour: number,
  user: GuildMember
) => {
  const server = client.guilds.get(serverId);
  if (!server) {
    return `${emoji.error} Something went wrong.\n\`Invalid server id ${serverId}\``;
  }

  const serverColours: { [key: string]: Colour } = await DB.getPath(
    `colours/${serverId}`
  );
  const keys = Object.keys(serverColours);

  if (colour > keys.length) {
    return `${emoji.error} No colour exists with number ${colour}.`;
  }

  const chosenKey = keys[colour - 1];
  const chosenColor = serverColours[chosenKey];

  const role = server.roles.get(chosenColor.role);
  if (role) {
    await role.delete();
  }

  await DB.deletePath(`colours/${serverId}/${chosenKey}`);

  Log.send(
    'Colour deleted',
    `**${chosenColor.name}** (#${colour}) deleted.`,
    serverId,
    {
      user,
      color: chosenColor.hex
    }
  );

  const embed = new RichEmbed();
  embed.setColor(chosenColor.hex);
  embed.title = 'Colour renamed';
  embed.description = `Successfully deleted colour **${chosenColor.name}**.`;
  return embed;
};

const importColour = async (
  serverId: string,
  roleName: string,
  user: GuildMember
) => {
  const server = client.guilds.get(serverId);
  if (!server) {
    return `${emoji.error} Something went wrong.\n\`Invalid server id ${serverId}\``;
  }

  const matchedRole = server.roles.find(
    role => role.name.toLowerCase() === roleName.toLowerCase()
  );
  if (!matchedRole) {
    return `${emoji.error} I couldn't find a role named ${roleName}.`;
  }

  const serverColours: Colour[] = await DB.getArrayAtPath(
    `colours/${serverId}`
  );
  const colourCount = !!serverColours ? serverColours.length : 0;

  if (!!serverColours.find(colour => colour.role === matchedRole.id)) {
    return `${emoji.error} I already know about ${matchedRole.name}.`;
  }

  const { id, name, hexColor } = matchedRole;
  const colourData: Colour = {
    name,
    hex: hexColor.replace('#', ''),
    role: id
  };
  await DB.pushAtPath(`colours/${serverId}`, colourData);

  const newColourNumber = colourCount + 1;

  Log.send(
    'Colour imported',
    `**${name}** imported from role ${matchedRole} as #${newColourNumber}.`,
    serverId,
    { user, color: hexColor }
  );

  const embed = new RichEmbed();
  embed.setColor(hexColor);
  embed.title = 'Colour created';
  embed.description = `Successfully imported colour **${name}** (#${newColourNumber}).`;
  return embed;
};

const reorderColours = async (serverId: string, channel: TextChannel) => {
  const server = client.guilds.get(serverId);
  if (!server) {
    return `${emoji.error} Something went wrong.\n\`Invalid server id ${serverId}\``;
  }

  const serverColours: Colour[] = await DB.getArrayAtPath(
    `colours/${serverId}`
  );
  if (!serverColours.length) {
    return `${emoji.error} No colours have been set up.`;
  }

  const sortedColours = serverColours.sort((a, b) => {
    const colourA = Color(`#${a.hex}`);
    const colourB = Color(`#${b.hex}`);

    if (colourA.saturationv() < 5 && colourB.saturationv() < 5) {
      return colourA.value() < colourB.value() ? -1 : 1;
    } else if (colourA.saturationv() < 5) {
      return -1;
    } else if (colourB.saturationv() < 5) {
      return 1;
    }

    return colourA.hue() < colourB.hue() ? -1 : 1;
  });

  await DB.setPath(`colours/${serverId}`, sortedColours);

  const embed = new RichEmbed();
  embed.title = 'Colours reordered';
  embed.description = `Colours in the server have been reordered by hue. Remember to run '${PREFIX}colour list' or '${PREFIX}colour pin' to display the new list.`;
  embed.setColor('#408137');
  channel.send(embed);
};

const colourStats = async (serverId: string) => {
  const server = client.guilds.get(serverId);
  if (!server) {
    return `${emoji.error} Something went wrong.\n\`Invalid server id ${serverId}\``;
  }

  const serverColours: Colour[] = await DB.getArrayAtPath(
    `colours/${serverId}`
  );
  if (!serverColours.length) {
    return `${emoji.error} No colours have been set up.`;
  }

  const ranking = serverColours
    .map(colour => {
      const { name, hex, role: roleId } = colour;

      const role = server.roles.get(roleId);
      if (!role) {
        console.log(
          `Colour stats: Role ${roleId} in server ${serverId} no longer exists.`
        );
        return undefined;
      }

      return {
        name,
        hex,
        count: role.members.size
      };
    })
    .filter(notUndefined)
    .sort((a, b) => (a.count < b.count ? 1 : a.count > b.count ? -1 : 0));

  const top = ranking
    .slice(0, 10)
    .map(item => `${item.name} - ${pluralise(item.count, 'person', 'people')}`)
    .join('\n');

  const bottom = ranking
    .slice(-10)
    .reverse()
    .map(item => `${item.name} - ${pluralise(item.count, 'person', 'people')}`)
    .join('\n');

  const embed = new RichEmbed();
  embed.title = 'Colour stats';
  embed.addField('Top 10', top, true);
  embed.addField('Bottom 10', bottom, true);
  embed.addField('Total colours', ranking.length, true);
  embed.setColor(ranking[0].hex);

  return embed;
};

const colourAccessibility = async (serverId: string, channel: TextChannel) => {
  const server = client.guilds.get(serverId);
  if (!server) {
    return `${emoji.error} Something went wrong.\n\`Invalid server id ${serverId}\``;
  }

  const serverColours: Colour[] = await DB.getArrayAtPath(
    `colours/${serverId}`
  );
  if (!serverColours.length) {
    return `${emoji.error} No colours have been set up.`;
  }

  const list = serverColours
    .map(colourData => {
      const { name, hex } = colourData;
      const colour = Color(`#${hex}`);

      const contrast = colour.contrast(DISCORD_BG_COLOUR);
      const accessibilityIndicator =
        contrast >= CONTRAST_THRESHOLD ? '✅' : '⚠️';

      return `${name}\n${accessibilityIndicator} ${contrast.toFixed(2)}`;
    })
    .join('\n\n');

  const chunks = Util.splitMessage(list, { maxLength: 2000 });
  const chunksArray = Array.isArray(chunks) ? chunks : [chunks];
  chunksArray.forEach((chunk, index) => {
    const embed = new RichEmbed();
    embed.title =
      index === 0
        ? `Colour accessibility audit`
        : 'Colour accessibility audit (continued)';
    embed.description = chunk;
    channel.send(embed);
  });
};

const getHelp = (showModCommands = false) => {
  const embed = new RichEmbed();
  embed.addField(
    '!cb colour <number>',
    'Sets your own colour, e.g. "colour 4".'
  );
  embed.addField(
    '!cb colour stats',
    'Shows stats about colours in the server.'
  );
  embed.addField('!cb colour list', 'Displays all available colours.');
  embed.addField(
    '!cb colour accessibility',
    'Shows the colour contrast for each colour role in the server.'
  );
  if (showModCommands) {
    embed.description = 'Commands marked with Ⓜ require mod privilege.';

    embed.addField(
      '!cb colour add <hex> <name> ️Ⓜ',
      'Adds a new colour with the given name and hex code, e.g. "colour add a86d3a bread".'
    );
    embed.addField(
      '!cb colour delete <number> Ⓜ',
      'Deletes the specified colour, e.g. "colour delete 7".'
    );
    embed.addField(
      '!cb colour rename <number> <name> Ⓜ',
      'Renames an existing colour, e.g. "colour rename 7 biscuit".'
    );
    embed.addField(
      '!cb colour import <role> Ⓜ',
      'Adds a colour using an already existing role, e.g. "color import eggplant".'
    );
    embed.addField(
      '!cb colour pin Ⓜ',
      'Pins the colour list to the current channel.'
    );
    embed.addField(
      '!cb colour reorder Ⓜ',
      `Reorders the server's colours by hue.`
    );
  }
  return embed;
};

const colourCommand: CommandFn = async (params, msg) => {
  if (params.length < 1) {
    return;
  }

  const subCommand = params[0].toLowerCase();
  const serverId = msg.guild.id;

  const modRoles = await DB.getArrayAtPath(`modRoles/${serverId}`);

  const user = msg.member;
  const isMod = !!modRoles.length
    ? !!user.roles.find(role => modRoles.includes(role.id))
    : true;

  const setNumber = subCommand === 'remove' ? 0 : parseInt(subCommand);
  if (!isNaN(setNumber)) {
    const message = await setColour(serverId, user, setNumber);
    const sentMessage = await msg.channel.send(message);
    return deleteAfterDelay(msg, sentMessage);
  }

  const chosenColor = parseInt(params[1]);
  const isValid = !isNaN(chosenColor);

  if (subCommand === 'random') {
    const message = await setRandomColour(serverId, user);
    const sentMessage = await msg.channel.send(message);
    return deleteAfterDelay(msg, sentMessage);
  }

  if (subCommand === 'help') {
    const message = getHelp(isMod);
    return msg.channel.send(message);
  }

  if (subCommand === 'list') {
    const message = await listColours(serverId);
    const sentMessage = await msg.channel.send(message);
    return deleteAfterDelay(msg);
  }

  if (subCommand === 'stats') {
    const message = await colourStats(serverId);
    return msg.channel.send(message);
  }

  if (subCommand === 'accessibility') {
    await colourAccessibility(serverId, msg.channel as TextChannel);
    return;
  }

  if (subCommand === 'pin' && isMod) {
    const channel = msg.channel;
    if (channel instanceof TextChannel) {
      await pinColourList(serverId, channel);
    }
    return deleteAfterDelay(msg);
  }

  if (subCommand === 'reorder' && isMod) {
    const channel = msg.channel;
    if (channel instanceof TextChannel) {
      await reorderColours(serverId, channel);
    }
  }

  if (subCommand === 'add' && isMod) {
    const message = await createColour(
      serverId,
      params[1],
      params.slice(2).join(' '),
      msg.member
    );
    const sentMessage = await msg.channel.send(message);
    return deleteAfterDelay(msg, sentMessage);
  }

  if (subCommand === 'rename' && isValid && isMod) {
    const message = await renameColour(
      serverId,
      chosenColor,
      params.slice(2).join(' '),
      msg.member
    );
    const sentMessage = await msg.channel.send(message);
    return deleteAfterDelay(msg, sentMessage);
  }

  if (subCommand === 'delete' && isValid && isMod) {
    const message = await deleteColour(serverId, chosenColor, msg.member);
    const sentMessage = await msg.channel.send(message);
    return deleteAfterDelay(msg, sentMessage);
  }

  if (subCommand === 'import' && isMod) {
    const message = await importColour(
      serverId,
      params.slice(1).join(' '),
      msg.member
    );
    const sentMessage = await msg.channel.send(message);
    return deleteAfterDelay(msg, sentMessage);
  }
};

export const colour: Command = {
  params: ['•••'],
  description:
    'Manages roles for name colours. Get more info using "colour help".',
  fn: colourCommand,
  aliases: ['color']
};
