import axios from 'axios';
import moment from 'moment';
import _ from 'lodash';
import { RichEmbed, TextChannel } from 'discord.js';

import { DB } from '../../database';

import { EPIC_API_URL, GRAPHQL_QUERY } from './constants';
import { client } from '../..';
import { pluralise } from '../../strings';

interface GameDetails {
  name: string;
  image: string;
  url: string;
  startDate: string;
  endDate: string;
}

const parseResponse = (response: any): GameDetails[] => {
  const items = response.data.Catalog.searchStore.elements;
  const parsedItems = items
    .filter(
      (item: any) =>
        !!item.promotions?.promotionalOffers?.[0]?.promotionalOffers.length
    )
    .filter(
      (item: any) =>
        item.promotions.promotionalOffers[0].promotionalOffers[0]
          .discountSetting.discountPercentage === 0
    )
    .map((item: any) => ({
      name: item.title,
      image: item.keyImages
        .find((image: any) => image.type === 'DieselStoreFrontTall')
        .url.replace(/ /g, '%20'),
      url: `https://www.epicgames.com/store/en-US/product/${item.productSlug}`,
      startDate:
        item.promotions.promotionalOffers[0].promotionalOffers[0].startDate,
      endDate:
        item.promotions.promotionalOffers[0].promotionalOffers[0].endDate,
    }));

  return _.uniqBy(parsedItems, (item) => item.name);
};

const buildAnnouncements = (games: any[]) =>
  games.map((game) => {
    const embed = new RichEmbed();
    embed.title = `${game.name} is free on Epic`;
    embed.description = `Available until ${moment(game.endDate).format(
      'D MMMM'
    )}\n${game.url}`;
    embed.setImage(game.image);
    return embed;
  });

export const getFreeEpicGames = async () => {
  try {
    const response = await axios.post(
      EPIC_API_URL,
      { query: GRAPHQL_QUERY, variables: {} },
      {
        headers: { 'Content-Type': 'application/json' },
      }
    );

    return parseResponse(response.data);
  } catch (err) {
    console.error(err);
    return undefined;
  }
};

export const announceFreeEpicGames = async () => {
  const games = await getFreeEpicGames();
  if (!games) {
    console.error('[epicgames] Failed to fetch free games from Epic.');
    return;
  }

  const currentGames = await DB.getArrayAtPath('epicGames/currentGames');
  const gamesToAnnounce = games.filter(
    (game) => !currentGames.includes(game.name)
  );

  if (gamesToAnnounce.length > 0) {
    await DB.deletePath('epicGames/currentGames');
    games.forEach((game) => DB.pushAtPath('epicGames/currentGames', game.name));
    console.log(
      `[epicgames] ${pluralise(gamesToAnnounce.length, 'game')} to announce.`
    );
  } else {
    console.log('[epicgames] No new games to announce.');
    return;
  }

  const announcements = buildAnnouncements(gamesToAnnounce);

  const servers = await DB.getPath('epicGames/servers');
  if (!servers) {
    console.error('[epicgames] No servers set up to receive announcements.');
    return;
  }

  Object.keys(servers).forEach((serverId) => {
    const channelId = servers[serverId];
    const channel = client.channels.get(channelId) as TextChannel;
    if (channel) {
      announcements.forEach((announcement) => channel.send(announcement));
    }
  });

  console.log(
    `[epicgames] Made announcement in ${pluralise(
      Object.keys(servers).length,
      'server'
    )}.`
  );
};
