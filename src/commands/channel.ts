import * as Discord from 'discord.js';

import { Command, CommandFn } from '../interfaces';
import { client } from '../index';

const setChannel: CommandFn = (params, msg) => {
  if (params.length < 1) {
    return;
  }

  const param = params[0];
  const channelIdStart = param.indexOf('#') + 1;
  const channelIdEnd = param.indexOf('>');
  const channelId = param.substring(channelIdStart, channelIdEnd);

  const channel = client.channels.get(channelId) as Discord.TextChannel;
  if (!channel) {
    return msg.channel.send("I couldn't find that channel.");
  }

  // Do some DB stuff...

  msg.channel.send(`Switched channels to #${channel.name}.`);
  return channel.send(
    "I'll be sending birthday announcements in this channel from now on."
  );
};

export const channel: Command = {
  params: ['#name'],
  description:
    'Changes which channel birthday messages are posted in, e.g. "channel #birthdays".',
  fn: setChannel
};
