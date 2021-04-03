import { GuildMember } from 'discord.js';
import { Log } from '../logging';
import { updateList } from '../updateList';

export const onNicknameUpdated = (
  user: GuildMember,
  oldNickname: string | null,
  newNickname: string | null
) => {
  updateList(user.guild.id);

  if (!oldNickname) {
    const field = {
      name: 'Added',
      value: newNickname,
    };

    Log.send('Nickname added', `${user}`, user.guild.id, {
      user,
      customFields: [field],
    });
    return;
  }

  if (!newNickname) {
    const field = {
      name: 'Removed',
      value: oldNickname,
    };

    Log.send('Nickname removed', `${user}`, user.guild.id, {
      user,
      customFields: [field],
    });
    return;
  }

  const beforeField = { name: 'Before', value: oldNickname };
  const afterField = { name: 'After', value: newNickname };

  Log.send('Nickname changed', `${user}`, user.guild.id, {
    user,
    customFields: [beforeField, afterField],
  });
};
