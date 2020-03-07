import axios from 'axios';
import moment from 'moment';
import { RichEmbed, TextChannel } from 'discord.js';

import { DB } from '../../database';

import { EPIC_API_URL, GRAPHQL_QUERY } from './constants';
import { client } from '../..';

interface GameDetails {
  name: string;
  image: string;
  url: string;
  startDate: string;
  endDate: string;
}

const parseResponse = (response: any): GameDetails[] => {
  const items = response.data.Catalog.catalogOffers.elements;
  return items
    .filter(
      (item: any) =>
        !!item.promotions.promotionalOffers?.[0]?.promotionalOffers.length
    )
    .map((item: any) => ({
      name: item.title,
      image: item.keyImages.find(
        (image: any) => image.type === 'DieselStoreFrontTall'
      ).url,
      url: `https://www.epicgames.com/store/en-US/product/${item.productSlug}`,
      startDate:
        item.promotions.promotionalOffers[0].promotionalOffers[0].startDate,
      endDate: item.promotions.promotionalOffers[0].promotionalOffers[0].endDate
    }));
};

const buildAnnouncements = (games: any[]) =>
  games.map(game => {
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
        headers: { 'Content-Type': 'application/json' }
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
    return;
  }

  const currentGames = await DB.getArrayAtPath('epicGames/currentGames');
  const gamesToAnnounce = games.filter(
    game => !currentGames.includes(game.name)
  );

  if (gamesToAnnounce.length > 0) {
    await DB.deletePath('epicGames/currentGames');
    games.forEach(game => DB.pushAtPath('epicGames/currentGames', game.name));
  }

  const announcements = buildAnnouncements(gamesToAnnounce);

  const servers = await DB.getPath('epicGames/servers');
  if (!servers) {
    return;
  }

  Object.keys(servers).forEach(serverId => {
    const channelId = servers[serverId];
    const channel = client.channels.get(channelId) as TextChannel;
    if (channel) {
      announcements.forEach(announcement => channel.send(announcement));
    }
  });
};
