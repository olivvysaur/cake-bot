import Discord, { TextChannel } from 'discord.js';
import moment from 'moment';
import { config as loadEnv } from 'dotenv';

import { COMMANDS } from './commands';
import {
  getNextAnnouncementTime,
  setNextAnnouncementTime,
  getServers,
  addServer,
  removeServer,
  getServerChannel,
  setServerMentions,
  getServerMentions,
  getBirthdays
} from './database';
import { getUsername } from './users';

loadEnv();

export const client = new Discord.Client();

client.on('ready', () => {
  console.log(`Logged in as ${client.user.tag}!`);
});

client.on('message', async msg => {
  if (msg.content.includes('test username')) {
    console.log(getUsername(msg.guild.id, msg.member.id));
  }

  if (msg.content.includes('test get time')) {
    const date = await getNextAnnouncementTime();
    console.log(date.format('LLLL'));
    return;
  }

  if (msg.content.includes('test set time')) {
    const date = moment();
    setNextAnnouncementTime(date);
    return;
  }

  if (msg.content.includes('test channel')) {
    const serverId = msg.guild.id;
    const channelId = await getServerChannel(serverId);
    const channel = client.channels.get(channelId) as TextChannel;
    console.log(channel ? channel.name : 'undefined');
    return;
  }

  if (msg.content.includes('test set mentions')) {
    const serverId = msg.guild.id;
    setServerMentions(serverId, true);
    return;
  }

  if (msg.content.includes('test get mentions')) {
    const serverId = msg.guild.id;
    const mentions = await getServerMentions(serverId);
    console.log(mentions);
    return;
  }

  if (msg.content.includes('test add')) {
    const serverId = msg.guild.id;
    addServer(serverId);
    return;
  }

  if (msg.content.includes('test remove')) {
    const serverId = msg.guild.id;
    removeServer(serverId);
    return;
  }

  if (msg.content.includes('test servers')) {
    const servers = await getServers();
    console.log(servers);
    return;
  }

  if (msg.content.includes('test list')) {
    const serverId = msg.guild.id;
    const allBirthdays = await getBirthdays(serverId);
    const filteredBirthdays = await getBirthdays(serverId, moment('Oct 18'));
    console.log('All:', allBirthdays);
    console.log('Filtered:', filteredBirthdays);
    return;
  }

  if (!msg.isMentioned(client.user)) {
    return;
  }

  const request = msg.content.split(' ');
  const code = request[1];
  const params = request.slice(2);

  const command = COMMANDS[code];
  if (!command) {
    return;
  }

  command.fn(params, msg);
});

client.login(process.env.DISCORD_BOT_TOKEN);
