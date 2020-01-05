import { Emoji } from 'discord.js';

import { client } from './';

const EMOJI_SERVER_ID = process.env.DISCORD_SERVER_ID;
const EMOJI_NAMES = ['success', 'error', 'CancelPing'];

export let emoji: { [name: string]: Emoji } = {};

export const loadEmoji = () => {
  emoji = EMOJI_NAMES.reduce(
    (exportedEmoji, name) => ({
      ...exportedEmoji,
      [name]: client.emojis.find(
        emoji => emoji.guild.id === EMOJI_SERVER_ID && emoji.name === name
      )
    }),
    {}
  );
};
