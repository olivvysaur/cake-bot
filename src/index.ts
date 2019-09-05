import Discord from 'discord.js';
import { config as loadEnv } from 'dotenv';

import { COMMANDS } from './commands';

loadEnv();

export const client = new Discord.Client();

client.on('ready', () => {
  console.log(`Logged in as ${client.user.tag}!`);
});

client.on('message', msg => {
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

  // if (msg.content.startsWith('!test')) {
  //   const content = msg.content.replace('!test ', '');
  //   const parsedDate = parseDate(content);
  //   if (!parsedDate) {
  //     msg.reply('Invalid date');
  //   } else if (parsedDate instanceof Array) {
  //     msg.reply(
  //       `Ambiguous date: ${parsedDate
  //         .map(d => d.format('Do MMMM'))
  //         .join(' or ')}`
  //     );
  //   } else {
  //     msg.reply(parsedDate.format('Do MMMM'));
  //   }
  // }
});

client.login(process.env.DISCORD_BOT_TOKEN);
