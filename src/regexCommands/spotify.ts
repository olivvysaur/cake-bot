import { Message } from 'discord.js';

import { RegexCommand } from '../interfaces';
import { lookupSong } from '../commands/song';

const REGEX = /spotify:track:\w+/gi;

const lookupSpotifySong = async (msg: Message) => {
  console.log('hi');

  const match = msg.content.match(REGEX);
  if (!match) {
    return;
  }

  const requestedUrl = match[0];

  return lookupSong([requestedUrl], msg);
};

export const spotify: RegexCommand = {
  trigger: REGEX,
  fn: lookupSpotifySong,
};
