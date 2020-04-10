import { GuildMember, Role, Message, RichEmbed } from 'discord.js';
import Medusa from 'medusajs';

import { client } from '..';
import { notUndefined } from '../notUndefined';
import { Log } from '../logging';

interface RoleUpdateRecord {
  added: Role[];
  removed: Role[];
  logMessage?: Message;
}

const BATCH_THRESHOLD = 1000 * 60;

export const onRolesUpdated = async (
  user: GuildMember,
  oldRoles: Role[],
  newRoles: Role[]
) => {
  const userId = user.user.id;
  const serverId = user.guild.id;

  const addedRoles = newRoles.filter((role) => !oldRoles.includes(role));
  const removedRoles = oldRoles.filter((role) => !newRoles.includes(role));

  const existingRecord: RoleUpdateRecord = await Medusa.get(
    `roleUpdates.${userId}`,
    async (resolve: (value: any) => void) => {
      resolve({ added: [], removed: [], logMessage: undefined });
    },
    BATCH_THRESHOLD
  );

  const allAdded = [...existingRecord.added, ...addedRoles];
  const allRemoved = [...existingRecord.removed, ...removedRoles];
  const duplicates = allAdded.filter((role) => allRemoved.includes(role));

  const existingMessage = existingRecord.logMessage;

  if (!!duplicates.length || !existingMessage) {
    const addedField = !!addedRoles.length
      ? { name: 'Added', value: addedRoles.join(' ') }
      : undefined;

    const removedField = !!removedRoles.length
      ? { name: 'Removed', value: removedRoles.join(' ') }
      : undefined;

    const fields = [addedField, removedField].filter(notUndefined);

    const sentMessage = await Log.send('Roles updated', `${user}`, serverId, {
      user,
      customFields: fields,
    });

    await Medusa.put(
      `roleUpdates.${userId}`,
      {
        added: addedRoles,
        removed: removedRoles,
        logMessage: sentMessage,
      },
      BATCH_THRESHOLD
    );
  } else {
    const existingEmbed = existingMessage.embeds[0];
    const newEmbed = new RichEmbed();
    newEmbed.title = existingEmbed.title;
    newEmbed.description = existingEmbed.description;
    newEmbed.author = existingEmbed.author;
    newEmbed.timestamp = new Date(existingEmbed.timestamp);

    if (!!allAdded.length) {
      newEmbed.addField('Added', allAdded.join(' '));
    }
    if (!!allRemoved.length) {
      newEmbed.addField('Removed', allRemoved.join(' '));
    }

    const updatedMessage = await existingMessage.edit(newEmbed);
    await Medusa.put(
      `roleUpdates.${userId}`,
      {
        added: allAdded,
        removed: allRemoved,
        logMessage: updatedMessage,
      },
      BATCH_THRESHOLD
    );
  }
};
