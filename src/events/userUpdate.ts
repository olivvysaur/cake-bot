import { User } from 'discord.js';
import { onAvatarUpdated } from './avatarUpdate';

export const onUserUpdate = (oldUser: User, newUser: User) => {
  const { avatarURL: oldAvatarURL } = oldUser;
  const { avatarURL: newAvatarURL } = newUser;

  if (newAvatarURL !== oldAvatarURL) {
    onAvatarUpdated(newUser);
  }
};
