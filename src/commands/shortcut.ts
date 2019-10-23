import { Message } from 'discord.js';
import Medusa from 'medusajs';

import { Command, CommandFn, Shortcut } from '../interfaces';
import { PREFIX } from '../constants';
import { DB } from '../database';
import { getShortcuts } from '../checkShortcuts';

const createShortcut: CommandFn = async (params, msg) => {
  const serverId = msg.guild.id;
  const sender = msg.author.id;
  const channel = msg.channel;

  const messageFilter = (message: Message) => message.author.id === sender;

  await channel.send(
    `OK, let's set up a shortcut. First, what should the trigger be? For example, to set up a shortcut triggered by "${PREFIX}party", reply with "party". Reply with "cancel" to cancel.`
  );

  const collectedTrigger = await channel.awaitMessages(messageFilter, {
    time: 60000,
    maxMatches: 1
  });
  if (
    !collectedTrigger ||
    !collectedTrigger.size ||
    collectedTrigger.first().content.toLowerCase() === 'cancel'
  ) {
    return channel.send('❌ Shortcut creation cancelled.');
  }

  const trigger = collectedTrigger.first().content.toLowerCase();
  await channel.send(
    `OK, the trigger will be "${PREFIX}${trigger}". Now, what should command should run? For example, to run "${PREFIX}echo Party time!", reply with "echo Party time!". Reply with "cancel" to cancel.`
  );

  const collectedCommand = await channel.awaitMessages(messageFilter, {
    time: 60000,
    maxMatches: 1
  });
  if (
    !collectedCommand ||
    !collectedCommand.size ||
    collectedCommand.first().content.toLowerCase() === 'cancel'
  ) {
    return channel.send('❌ Shortcut creation cancelled.');
  }

  const command = collectedCommand.first().content;

  const shortcut: Shortcut = {
    trigger,
    command
  };

  await DB.pushAtPath(`shortcuts/${serverId}`, shortcut);

  const shortcuts = await getShortcuts(serverId);
  shortcuts.push(shortcut);
  await Medusa.put(`shortcuts.${serverId}`, shortcuts, 86400 * 1000);

  await channel.send(
    `✅ Got it! When someone uses "${PREFIX}${trigger}", I'll run "${PREFIX}${command}".`
  );
};

export const shortcut: Command = {
  description: 'Sets up a new shortcut for a command.',
  fn: createShortcut,
  requiresMod: true,
  params: []
};
