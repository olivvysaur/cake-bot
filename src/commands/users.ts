import { RichEmbed, GuildMember, Role, Util } from 'discord.js';

import { Command, CommandFn } from '../interfaces';
import { timeSince } from '../dates';
import moment = require('moment');
import { notUndefined } from '../notUndefined';
import { pluralise } from '../strings';

const FILTER_REGEX = /(\w+)\s*\(([\w\s\W]+?)\)/g;

type Filter = (users: GuildMember[]) => GuildMember[];

const createTenureFilter = (min: number): Filter => users =>
  users.filter(user => {
    const now = moment();
    const { joinedAt } = user;

    const diff = now.diff(joinedAt, 'days');
    return diff >= min;
  });

const createNoRoleFilter = (queryRole: Role): Filter => users =>
  users.filter(user => !user.roles.find(role => role.name === queryRole.name));

const getUsers: CommandFn = (params, msg) => {
  const server = msg.guild;
  const channel = msg.channel;

  const query = params.join(' ');
  const filterQueries = [];

  const filters = [];

  let match;
  do {
    match = FILTER_REGEX.exec(query);
    if (match) {
      filterQueries.push(match);
    }
  } while (match);

  const tenureQuery = filterQueries.find(
    filter => filter[1].toLowerCase() === 'tenure'
  );
  const tenureFilter = tenureQuery
    ? createTenureFilter(Number(tenureQuery[2]))
    : undefined;
  filters.push(tenureFilter);

  const roleQuery = filterQueries.find(
    filter => filter[1].toLowerCase() === 'missingrole'
  );
  const role = roleQuery
    ? server.roles.find(
        role => role.name.toLowerCase() === roleQuery[2].toLowerCase()
      )
    : undefined;
  const roleFilter = role ? createNoRoleFilter(role) : undefined;
  filters.push(roleFilter);

  const botFilter = (users: GuildMember[]) =>
    users.filter(user => !user.user.bot);
  filters.push(botFilter);

  const filtersToApply = filters.filter(notUndefined);
  const filteredUsers = filtersToApply.reduce(
    (users, filter) => filter(users),
    server.members.array()
  );

  const count = filteredUsers.length;
  const list = filteredUsers
    .map(user => `${user.displayName} (${user.user.tag})`)
    .sort((a, b) => a.localeCompare(b, 'en', { sensitivity: 'base' }))
    .join('\n');

  if (list.length < 2000) {
    const embed = new RichEmbed();
    embed.title = `${pluralise(count, 'user')} found`;
    embed.description = list;

    return channel.send(embed);
  } else {
    const chunks = Util.splitMessage(list, { maxLength: 2000 });
    (chunks as string[]).forEach((chunk, index) => {
      const embed = new RichEmbed();
      embed.title =
        index === 0 ? `${pluralise(count, 'user')} found` : '(continued)';
      embed.description = chunk;
      channel.send(embed);
    });
  }
};

export const users: Command = {
  description: 'Finds users based on one or more filters.',
  params: ['filter', '...'],
  fn: getUsers
};
