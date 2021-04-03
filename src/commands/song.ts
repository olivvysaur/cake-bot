import Axios from 'axios';
import { RichEmbed } from 'discord.js';

import { emoji } from '../emoji';
import { Command, CommandFn } from '../interfaces';

const API_URL = 'https://api.song.link/v1-alpha.1/links?url=';

const PLATFORMS = {
  appleMusic: 'Apple Music',
  spotify: 'Spotify',
  youtube: 'YouTube',
  amazonMusic: 'Amazon Music',
};

export const lookupSong: CommandFn = async (params, msg) => {
  const requestedUrl =
    params[0].startsWith('<') && params[0].endsWith('>')
      ? params[0].slice(1, -1)
      : params[0];

  try {
    const { status, data } = await Axios.get(API_URL + requestedUrl);

    if (status !== 200) {
      throw new Error(`Received status code ${status}`);
    }

    const {
      entityUniqueId,
      entitiesByUniqueId,
      pageUrl,
      linksByPlatform,
    } = data;

    const metadata = entitiesByUniqueId[entityUniqueId];
    const { title, artistName, thumbnailUrl } = metadata;

    const links = Object.entries(PLATFORMS).reduce((result, [key, name]) => {
      const url = linksByPlatform[key]?.url;
      if (url) {
        return {
          ...result,
          [name]: url,
        };
      } else {
        return result;
      }
    }, {});

    const description = Object.entries(links)
      .map(([platform, url]) => `[${platform}](${url})`)
      .join(' • ');

    const embed = new RichEmbed()
      .setTitle(`${title} - ${artistName}`)
      .setDescription(description + ` • [More platforms](${pageUrl})`)
      .setThumbnail(thumbnailUrl);

    msg.suppressEmbeds();
    return msg.channel.send(embed);
  } catch (error) {
    console.error(
      `Failed to look up song "${requestedUrl}" due to error: ${error}`
    );
    return msg.channel.send(
      `${emoji.error} I wasn't able to look up that song.`
    );
  }
};

export const song: Command = {
  fn: lookupSong,
  description: 'Get a link to a song or album on different streaming services.',
  params: ['url'],
};
