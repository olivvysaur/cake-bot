import moment from 'moment';

import { Command, CommandFn } from '../interfaces';
import { getBirthdays, DB } from '../database';
import { getUsername, findUser } from '../users';
import { formatDate } from '../dates';
import { emoji } from '../emoji';

const showNextBirthday: CommandFn = async (params, msg) => {
  const serverId = msg.guild.id;
  const serverBirthdays = await getBirthdays(serverId);

  let date = moment();
  let foundBirthdays = undefined;

  const startDate = moment();
  const startMonth = startDate.get('month');
  const startDay = startDate.get('date');

  while (!foundBirthdays) {
    date = date.add(1, 'day');
    const month = date.get('month');
    const day = date.get('date');

    if (serverBirthdays[month] && serverBirthdays[month][day]) {
      if (serverBirthdays[month][day].length) {
        foundBirthdays = serverBirthdays[month][day];
        break;
      }
    }

    if (month === startMonth && day === startDay) {
      return msg.channel.send(`${emoji.error} No birthdays have been saved.`);
    }
  }

  const names = foundBirthdays
    .map((userId: string) => getUsername(serverId, userId))
    .filter(Boolean);

  if (names.length === 0) {
    return;
  }

  const startOfList = names.slice(0, -1).join(', ');
  const endOfList = names.slice(-1).join('');

  const list =
    names.length > 2
      ? `${startOfList}, and ${endOfList}`
      : names.length === 2
      ? `${startOfList} and ${endOfList}`
      : names[0];

  const unit = names.length === 1 ? 'birthday' : 'birthdays';
  const message = `The next ${unit} will be ${list} on ${formatDate(date)}.`;

  msg.channel.send(message);
};

const showUserBirthday: CommandFn = async (params, msg) => {
  const serverId = msg.guild.id;
  const userQuery = params.join(' ');

  const user = findUser(userQuery, serverId);
  if (!user) {
    return msg.channel.send(
      `${emoji.error} I couldn't find a user named ${userQuery}.`
    );
  }

  const birthdayData = await DB.getPath(`birthdays/${serverId}/${user.id}`);
  if (!birthdayData) {
    return msg.channel.send(
      `${emoji.error} I don't know when ${user.displayName}'s birthday is.`
    );
  }

  const { month, day } = birthdayData;
  const date = moment()
    .month(month)
    .date(day);
  const formattedDate = formatDate(date);

  return msg.channel.send(
    `${user.displayName}'s birthday is on ${formattedDate}.`
  );
};

const runBirthdayCommand: CommandFn = (params, msg) => {
  params.length ? showUserBirthday(params, msg) : showNextBirthday(params, msg);
};

export const birthday: Command = {
  description: 'Shows the next upcoming birthday in the server.',
  params: [],
  fn: runBirthdayCommand
};
