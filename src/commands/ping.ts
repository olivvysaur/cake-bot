import { Command } from '../interfaces';

export const ping: Command = {
  params: [],
  description: 'Simple ping to check the bot is responding.',
  fn: (params, msg) => msg.channel.send('pong')
};
