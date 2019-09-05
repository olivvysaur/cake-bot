import { client } from './index';

export const getUsername = (serverId: string, userId: string) => {
  const server = client.guilds.get(serverId);
  if (!server) {
    return null;
  }

  const user = server.members.get(userId);
  if (!user) {
    return null;
  }

  return user.nickname || user.user.username;
};
