import Discord from 'discord.js';
import { config as loadEnv } from 'dotenv';
import schedule from 'node-schedule';

import { COMMANDS } from './commands';
import { announceBirthdays } from './announce';
import { addServer, removeServer, removeBirthday } from './database';

loadEnv();

export const client = new Discord.Client();

client.on('ready', () => {
  console.log(`Logged in as ${client.user.tag}!`);

  const rule = new schedule.RecurrenceRule();
  rule.hour = 5;
  rule.minute = 0;

  schedule.scheduleJob(rule, announceBirthdays);
  console.log('Scheduled announcement for 5:00 AM.');
});

client.on('guildCreate', async server => {
  addServer(server.id);
  console.log(`Joined server ${server.id} (${server.name})`);
});

client.on('guildDelete', async server => {
  removeServer(server.id);
  console.log(`Left server ${server.id} (${server.name})`);
});

client.on('guildMemberRemove', async member => {
  const serverId = member.guild.id;
  const userId = member.id;

  console.log(
    `User ${userId} has left server ${serverId}, removing their birthday.`
  );
  removeBirthday(serverId, userId);
});

client.on('message', async msg => {
  if (!msg.isMentioned(client.user)) {
    return;
  }

  const request = msg.content.split(' ').filter(word => !!word.length);
  const code = request[1];
  const params = request.slice(2);

  const command = COMMANDS[code];
  if (!command) {
    return;
  }

  command.fn(params, msg);
});

client.login(process.env.DISCORD_BOT_TOKEN);
