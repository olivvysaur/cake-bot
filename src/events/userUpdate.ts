import { User } from 'discord.js';
import { onAvatarUpdated } from './avatarUpdate';
import { onUsernameUpdated } from './usernameUpdate';

export const onUserUpdate = (oldUser: User, newUser: User) => {
  const { avatarURL: oldAvatarURL, username: oldUsername } = oldUser;
  const { avatarURL: newAvatarURL, username: newUsername } = newUser;

  if (newAvatarURL !== oldAvatarURL) {
    onAvatarUpdated(newUser);
  }

  if (newUsername !== oldUsername) {
    onUsernameUpdated(newUser, oldUsername, newUsername);
  }
};
