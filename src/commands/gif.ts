import querystring from 'querystring';
import axios from 'axios';

import { Command, CommandFn } from '../interfaces';
import { emoji } from '../emoji';

const GIPHY_RANDOM_URL = 'https://api.giphy.com/v1/gifs/random';
const GIPHY_TRANSLATE_URL = 'https://api.giphy.com/v1/gifs/translate';

const getGif: CommandFn = async (params, msg) => {
  if (!process.env.GIPHY_API_KEY) {
    console.error('gif command will not work because GIPHY_API_KEY is not set');
    return;
  }

  const channel = msg.channel;

  if (params.length === 0) {
    const queryParams = {
      api_key: process.env.GIPHY_API_KEY,
      tag: '',
      rating: 'PG-13'
    };
    const query = querystring.stringify(queryParams);
    const url = `${GIPHY_RANDOM_URL}?${query}`;

    const response = await axios.get(url);
    if (response.status !== 200) {
      console.error(`gif command failed due to error ${response.status}`);
      return channel.send(
        `${emoji.error} I'm having trouble finding GIFs at the moment.`
      );
    }

    return channel.send(response.data.data.image_url);
  } else {
    const searchTerm = params.join(' ');
    const queryParams = {
      api_key: process.env.GIPHY_API_KEY,
      s: searchTerm,
      rating: 'PG-13'
    };
    const query = querystring.stringify(queryParams);
    const url = `${GIPHY_TRANSLATE_URL}?${query}`;

    const response = await axios.get(url);
    if (response.status !== 200) {
      console.error(`gif command failed due to error ${response.status}`);
      return channel.send(
        `${emoji.error} I'm having trouble finding GIFs at the moment.`
      );
    }

    return channel.send(response.data.data.images.original.url);
  }
};

export const gif: Command = {
  description: 'Finds a random gif based on a search term.',
  params: ['search_term'],
  fn: getGif
};
