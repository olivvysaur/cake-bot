import { Command, CommandFn } from '../interfaces';
import { PREFIX } from '../constants';

const sendHugs: CommandFn = (params, msg) => {
  msg.channel.send(
    `*hugs ${params.join(
      ' '
    )}* :heart: :yellow_heart: :green_heart: :blue_heart: :purple_heart:`
  );
  msg.delete();
};

export const hug: Command = {
  description: `Sends hugs to someone, e.g. ${PREFIX}hugs valentine`,
  fn: sendHugs,
  params: ['user']
};
