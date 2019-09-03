import Discord from 'discord.js';
import { config as loadEnv } from 'dotenv';

import { parseDate } from './parseDate';

loadEnv();

const client = new Discord.Client();

client.on('ready', () => {
  console.log(`Logged in as ${client.user.tag}!`);
});

client.on('message', msg => {
  if (msg.content === 'ping') {
    msg.reply('pong');
  }

  if (msg.content.startsWith('!test')) {
    const content = msg.content.replace('!test ', '');
    const parsedDate = parseDate(content);
    if (!parsedDate) {
      msg.reply('Invalid date');
    } else if (parsedDate instanceof Array) {
      msg.reply(
        `Ambiguous date: ${parsedDate
          .map(d => d.format('Do MMMM'))
          .join(' or ')}`
      );
    } else {
      msg.reply(parsedDate.format('Do MMMM'));
    }
  }
});

client.login(process.env.DISCORD_BOT_TOKEN);
