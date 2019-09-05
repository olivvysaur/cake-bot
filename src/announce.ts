import { TextChannel } from 'discord.js';
import moment from 'moment';

import {
  getServers,
  getBirthdays,
  getNextAnnouncementDate,
  setNextAnnouncementDate
} from './database';
import { getUsername } from './users';
import { client } from '.';

export const announceBirthdays = async () => {
  const { month, day } = await getNextAnnouncementDate();

  const servers = await getServers();
  Object.keys(servers).forEach(async serverId => {
    const { channel: channelId } = servers[serverId];

    if (!channelId) {
      return;
    }

    const channel = client.channels.get(channelId) as TextChannel;
    if (!channel) {
      return;
    }

    const birthdays = await getBirthdays(serverId, month, day);
    if (!birthdays.length) {
      return;
    }

    const names = birthdays
      .map((userId: string) => getUsername(serverId, userId))
      .filter(Boolean);

    const startOfList = names.slice(0, -1).join(', ');
    const endOfList = names.slice(-1).join('');
    const list =
      names.length > 1 ? `${startOfList} and ${endOfList}` : startOfList;

    const message = `🎂🎈🎈🎈🎈🎈🎈🎈🎈🎈🎈🎂

Happy birthday to ${list}!

🎂🎈🎈🎈🎈🎈🎈🎈🎈🎈🎈🎂`;

    channel.send(message);
  });

  const announcementDate = moment()
    .month(month)
    .date(day)
    .add(1, 'day');
  setNextAnnouncementDate(announcementDate);
};
