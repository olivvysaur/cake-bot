import { GuildMember } from 'discord.js';
import { onRolesUpdated } from './roleUpdates';
import { onNicknameUpdated } from './nicknameUpdate';

export const onMemberUpdate = async (
  oldUser: GuildMember,
  newUser: GuildMember
) => {
  const { roles: oldRoles, nickname: oldNickname } = oldUser;
  const { roles: newRoles, nickname: newNickname } = newUser;

  if (!newRoles.equals(oldRoles)) {
    onRolesUpdated(newUser, oldRoles.array(), newRoles.array());
  }

  if (newNickname !== oldNickname) {
    onNicknameUpdated(newUser, oldNickname, newNickname);
  }
};
