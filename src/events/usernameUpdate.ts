import { User } from 'discord.js';

import { client } from '../';
import { Log } from '../logging';

export const onUsernameUpdated = (
  user: User,
  oldUsername: string,
  newUsername: string
) => {
  const userId = user.id;

  const commonServerIds = client.guilds
    .filter((guild) => !!guild.members.get(userId))
    .keyArray();

  commonServerIds.forEach(async (serverId) => {
    const guildMember = client.guilds.get(serverId)?.members.get(userId);

    const beforeField = { name: 'Before', value: oldUsername };
    const afterField = { name: 'After', value: newUsername };

    Log.send('Username changed', `${user}`, serverId, {
      user: guildMember,
      customFields: [beforeField, afterField],
    });
  });
};
