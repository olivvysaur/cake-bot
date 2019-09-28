import { GuildMember, RichEmbed, Attachment } from 'discord.js';
import { createCanvas } from 'canvas';

import { Command, CommandFn } from '../interfaces';
import { client } from '..';
import { DB } from '../database';

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
  console.log(columnWidths, canvasWidth);

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

  const { id, name, hexColor: hex } = matchedRole;
  const colourData: Colour = {
    name,
    hex,
    role: id
  };
  await DB.pushAtPath(`colours/${serverId}`, colourData);

  const newColourNumber = colourCount + 1;

  const embed = new RichEmbed();
  embed.setColor(hex);
  embed.title = 'Colour created';
  embed.description = `Successfully imported colour **${name}** (#${newColourNumber}).`;
  return embed;
};

const getHelp = (showModCommands = false) => {
  const embed = new RichEmbed();
  embed.title = 'Colour help';
  embed.addField('colour <number>', 'Sets your own colour, e.g. "colour 4".');
  embed.addField('colour list', 'Displays all available colours.');
  if (showModCommands) {
    embed.description = 'Commands marked with Ⓜ️ require mod privilege.';

    embed.addField(
      'colour add <hex> <name> ️Ⓜ️',
      'Add a new colour with the given name and hex code, e.g. "colour add a86d3a bread".'
    );
    embed.addField(
      'colour delete <number> Ⓜ️',
      'Delete the specified colour, e.g. "colour delete 7".'
    );
    embed.addField(
      'colour rename <number> <name> Ⓜ️',
      'Rename an existing colour, e.g. "colour rename 7 biscuit".'
    );
    embed.addField(
      'colour import <role> Ⓜ️',
      'Add a colour using an already existing role, e.g. "color import eggplant".'
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
    return msg.channel.send(message);
  }

  const chosenColor = parseInt(params[1]);
  const isValid = !isNaN(chosenColor);

  if (subCommand === 'help') {
    const message = getHelp(isMod);
    return msg.channel.send(message);
  }

  if (subCommand === 'list') {
    const message = await listColours(serverId);
    return msg.channel.send(message);
  }

  if (subCommand === 'add' && isMod) {
    const message = await createColour(
      serverId,
      params[1],
      params.slice(2).join(' ')
    );
    return msg.channel.send(message);
  }

  if (subCommand === 'rename' && isValid && isMod) {
    const message = await renameColour(
      serverId,
      chosenColor,
      params.slice(2).join(' ')
    );
    return msg.channel.send(message);
  }

  if (subCommand === 'delete' && isValid && isMod) {
    const message = await deleteColour(serverId, chosenColor);
    return msg.channel.send(message);
  }

  if (subCommand === 'import' && isMod) {
    const message = await importColour(serverId, params.slice(1).join(' '));
    return msg.channel.send(message);
  }
};

export const colour: Command = {
  params: ['•••'],
  description:
    'Manages colours, Iris style. Get more info using "colour help".',
  fn: colourCommand,
  aliases: ['color'],
  hidden: true
};