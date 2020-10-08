import { GuildMember, User } from 'discord.js';
import moment from 'moment';

import { DB, removeBirthday } from '../database';
import { timeSince } from '../dates';
import { Log } from '../logging';
import { updateList } from '../updateList';

export const onMemberLeave = async (member: GuildMember) => {
  const serverId = member.guild.id;
  const userId = member.id;

  const auditLog = await member.guild.fetchAuditLogs({
    type: 'MEMBER_KICK',
    limit: 1,
  });
  const entry = auditLog.entries.first();
  if (entry) {
    const targetUser = entry.target as User;
    if (targetUser.id === userId) {
      const executor = entry.executor;
      const customFields = [
        { name: 'Reason', value: entry.reason || 'No reason given' },
      ];
      Log.red(
        'Member kicked',
        `${targetUser} was kicked by ${executor}.`,
        serverId,
        { author: targetUser, customFields }
      );
    }
  }

  const fields = [
    { name: 'Member for', value: timeSince(member.joinedAt).asString },
    {
      name: 'Roles',
      value: member.roles
        .array()
        .filter((role) => role.name !== '@everyone')
        .sort((a, b) => (a.name.toLowerCase() < b.name.toLowerCase() ? -1 : 1))
        .join(' '),
    },
  ];
  Log.red('Member left', `${member}`, serverId, {
    user: member,
    customFields: fields,
  });

  const userBirthday = await DB.getPath(`birthdays/${serverId}/${userId}`);
  if (!userBirthday) {
    return;
  }

  console.log(
    `User ${userId} has left server ${serverId}, removing their birthday.`
  );
  removeBirthday(serverId, userId);
  updateList(serverId);

  Log.red(
    'Birthday removed',
    'User left the server so their birthday was removed.',
    serverId,
    { user: member }
  );
};
