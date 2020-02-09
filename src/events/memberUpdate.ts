import { GuildMember } from 'discord.js';
import { onRolesUpdated } from './roleUpdates';

export const onMemberUpdate = async (
  oldUser: GuildMember,
  newUser: GuildMember
) => {
  const { roles: oldRoles } = oldUser;
  const { roles: newRoles } = newUser;

  if (!newRoles.equals(oldRoles)) {
    onRolesUpdated(newUser, oldRoles.array(), newRoles.array());
  }
};
