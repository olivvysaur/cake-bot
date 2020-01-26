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

  return user.displayName;
};

const USER_MENTION_REGEX = /<@!(\d+)>/;

export const parseUserMention = (text: string) => {
  const match = text.match(USER_MENTION_REGEX);
  return !!match ? match[1] : undefined;
};

export const findUser = (query: string, serverId: string) => {
  const server = client.guilds.get(serverId);
  if (!server) {
    return undefined;
  }

  const members = server.members;
  const searchQuery = query.toLowerCase();

  const queryMention = parseUserMention(searchQuery);
  if (!!queryMention) {
    const byMention = members.find(member => member.id === queryMention);
    if (byMention) {
      return byMention;
    }
  }

  const byId = members.find(member => member.id === searchQuery);
  if (byId) {
    return byId;
  }

  const byTag = members.find(
    member => member.user.tag.toLowerCase() === searchQuery
  );
  if (byTag) {
    return byTag;
  }

  const byNickname = members.find(
    member => !!member.nickname && member.nickname.toLowerCase() === searchQuery
  );
  if (byNickname) {
    return byNickname;
  }

  const byUsername = members.find(
    member => member.user.username.toLowerCase() === searchQuery
  );
  if (byUsername) {
    return byUsername;
  }

  return undefined;
};
