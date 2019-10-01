import {
  GuildMember,
  RichEmbed,
  Attachment,
  TextChannel,
  Message
} from 'discord.js';
import { createCanvas } from 'canvas';

import { Command, CommandFn } from '../interfaces';
import { client } from '..';
import { DB } from '../database';
import { deleteAfterDelay } from '../messages';

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
    return `⚠️ Something went wrong.\n\`Invalid server id ${serverId}\``;
  }

  const serverColours: Colour[] = await DB.getArrayAtPath(
    `colours/${serverId}`
  );

  if (colour > serverColours.length) {
    return `⚠️ No colour exists with number ${colour}.`;
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

  const embed = new RichEmbed();
  embed.setColor(chosenColor.hex);
  embed.title = 'Colour changed';
  embed.description = `${user}, your colour is now **${chosenColor.name}**.`;
  return embed;
};

const listColours = async (serverId: string) => {
  const server = client.guilds.get(serverId);
  if (!server) {
    return `⚠️ Something went wrong.\n\`Invalid server id ${serverId}\``;
  }

  const serverColours: Colour[] = await DB.getArrayAtPath(
    `colours/${serverId}`
  );
  if (!serverColours.length) {
    return '⚠️ No colours have been set up.';
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

const createColour = async (serverId: string, hex: string, name: string) => {
  const server = client.guilds.get(serverId);
  if (!server) {
    return `⚠️ Something went wrong.\n\`Invalid server id ${serverId}\``;
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

  const embed = new RichEmbed();
  embed.setColor(hex);
  embed.title = 'Colour created';
  embed.description = `Successfully created colour **${name}** (#${newColourNumber}).`;
  return embed;
};

const renameColour = async (serverId: string, colour: number, name: string) => {
  const server = client.guilds.get(serverId);
  if (!server) {
    return `⚠️ Something went wrong.\n\`Invalid server id ${serverId}\``;
  }

  const serverColours: { [key: string]: Colour } = await DB.getPath(
    `colours/${serverId}`
  );
  const keys = Object.keys(serverColours);

  if (colour > keys.length) {
    return `⚠️ No colour exists with number ${colour}.`;
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

  const embed = new RichEmbed();
  embed.setColor(chosenColor.hex);
  embed.title = 'Colour renamed';
  embed.description = `Successfully renamed colour **${oldName}** to **${name}**.`;
  return embed;
};

const deleteColour = async (serverId: string, colour: number) => {
  const server = client.guilds.get(serverId);
  if (!server) {
    return `⚠️ Something went wrong.\n\`Invalid server id ${serverId}\``;
  }

  const serverColours: { [key: string]: Colour } = await DB.getPath(
    `colours/${serverId}`
  );
  const keys = Object.keys(serverColours);

  if (colour > keys.length) {
    return `⚠️ No colour exists with number ${colour}.`;
  }

  const chosenKey = keys[colour - 1];
  const chosenColor = serverColours[chosenKey];

  const role = server.roles.get(chosenColor.role);
  if (role) {
    await role.delete();
  }

  await DB.deletePath(`colours/${serverId}/${chosenKey}`);

  const embed = new RichEmbed();
  embed.setColor(chosenColor.hex);
  embed.title = 'Colour renamed';
  embed.description = `Successfully deleted colour **${chosenColor.name}**.`;
  return embed;
};

const importColour = async (serverId: string, roleName: string) => {
  const server = client.guilds.get(serverId);
  if (!server) {
    return `⚠️ Something went wrong.\n\`Invalid server id ${serverId}\``;
  }

  const matchedRole = server.roles.find(
    role => role.name.toLowerCase() === roleName.toLowerCase()
  );
  if (!matchedRole) {
    return `⚠️ I couldn't find a role named ${roleName}.`;
  }

  const serverColours: Colour[] = await DB.getArrayAtPath(
    `colours/${serverId}`
  );
  const colourCount = !!serverColours ? serverColours.length : 0;

  if (!!serverColours.find(colour => colour.role === matchedRole.id)) {
    return `⚠️ I already know about ${matchedRole.name}.`;
  }

  const { id, name, hexColor } = matchedRole;
  const colourData: Colour = {
    name,
    hex: hexColor.replace('#', ''),
    role: id
  };
  await DB.pushAtPath(`colours/${serverId}`, colourData);

  const newColourNumber = colourCount + 1;

  const embed = new RichEmbed();
  embed.setColor(hexColor);
  embed.title = 'Colour created';
  embed.description = `Successfully imported colour **${name}** (#${newColourNumber}).`;
  return embed;
};

const getHelp = (showModCommands = false) => {
  const embed = new RichEmbed();
  embed.addField(
    '!cb colour <number>',
    'Sets your own colour, e.g. "colour 4".'
  );
  // embed.addField('!cb colour list', 'Displays all available colours.');
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
  }
  return embed;
};

const colourCommand: CommandFn = async (params, msg) => {
  if (params.length < 1) {
    return;
  }

  const subCommand = params[0];
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

  if (subCommand === 'help') {
    const message = getHelp(isMod);
    return msg.channel.send(message);
  }

  // if (subCommand === 'list') {
  //   const message = await listColours(serverId);
  //   const sentMessage = await msg.channel.send(message);
  //   return deleteAfterDelay(msg, sentMessage);
  // }

  if (subCommand === 'pin' && isMod) {
    const channel = msg.channel;
    if (channel instanceof TextChannel) {
      await pinColourList(serverId, channel);
    }
    return deleteAfterDelay(msg);
  }

  if (subCommand === 'add' && isMod) {
    const message = await createColour(
      serverId,
      params[1],
      params.slice(2).join(' ')
    );
    const sentMessage = await msg.channel.send(message);
    return deleteAfterDelay(msg, sentMessage);
  }

  if (subCommand === 'rename' && isValid && isMod) {
    const message = await renameColour(
      serverId,
      chosenColor,
      params.slice(2).join(' ')
    );
    const sentMessage = await msg.channel.send(message);
    return deleteAfterDelay(msg, sentMessage);
  }

  if (subCommand === 'delete' && isValid && isMod) {
    const message = await deleteColour(serverId, chosenColor);
    const sentMessage = await msg.channel.send(message);
    return deleteAfterDelay(msg, sentMessage);
  }

  if (subCommand === 'import' && isMod) {
    const message = await importColour(serverId, params.slice(1).join(' '));
    const sentMessage = await msg.channel.send(message);
    return deleteAfterDelay(msg, sentMessage);
  }
};

export const colour: Command = {
  params: ['•••'],
  description:
    'Manages colours, Iris style. Get more info using "colour help".',
  fn: colourCommand,
  aliases: ['color']
};
