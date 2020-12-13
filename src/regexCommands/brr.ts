import { Message } from 'discord.js';
import { shuffle } from 'lodash';
import { RegexCommand } from '../interfaces';

const addReactions = (msg: Message) => {
  shuffle(['❄️', '☃️', '🥶']).forEach((emoji) => msg.react(emoji));
};

export const brr: RegexCommand = {
  trigger: /go(es)?\s+brr+/gi,
  fn: addReactions,
};
