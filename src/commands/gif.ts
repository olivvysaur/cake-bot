import querystring from 'querystring';
import axios from 'axios';

import { Command, CommandFn } from '../interfaces';
import { emoji } from '../emoji';
import { random } from '../random';

const RANDOM_URL = 'https://api.tenor.com/v1/random';
const TRENDING_URL = 'https://api.tenor.com/v1/trending';

const baseParams = {
  key: process.env.TENOR_API_KEY,
  locale: 'en_US',
  media_filter: 'minimal',
  contentfilter: 'low',
  limit: 50,
};

const getGif: CommandFn = async (params, msg) => {
  if (!process.env.TENOR_API_KEY) {
    console.error('gif command will not work because TENOR_API_KEY is not set');
    return;
  }

  const channel = msg.channel;

  if (params.length === 0) {
    const queryParams = {
      ...baseParams,
    };

    const query = querystring.stringify(queryParams);
    const url = `${TRENDING_URL}?${query}`;

    const response = await axios.get(url);

    if (response.status !== 200) {
      console.error(`gif command failed due to error ${response.status}`);
      return channel.send(
        `${emoji.error} I'm having trouble finding GIFs at the moment.`
      );
    }

    const results = response.data.results;

    if (!results.length) {
      return channel.send(
        `${emoji.error} I'm having trouble finding GIFs at the moment.`
      );
    }

    const chosenIndex = random(results.length);
    return channel.send(results[chosenIndex].itemurl);
  }

  const searchTerm = params.join(' ');
  const queryParams = {
    ...baseParams,
    q: searchTerm,
  };

  const query = querystring.stringify(queryParams);
  const url = `${RANDOM_URL}?${query}`;

  const response = await axios.get(url);
  if (response.status !== 200) {
    console.error(`gif command failed due to error ${response.status}`);
    return channel.send(
      `${emoji.error} I'm having trouble finding GIFs at the moment.`
    );
  }

  const results = response.data.results;

  if (!results.length) {
    return channel.send(
      `${emoji.error} I'm having trouble finding GIFs at the moment.`
    );
  }

  const chosenIndex = random(results.length);
  return channel.send(results[chosenIndex].itemurl);
};

export const gif: Command = {
  description: 'Finds a random gif based on a search term.',
  params: ['search_term'],
  fn: getGif,
};
