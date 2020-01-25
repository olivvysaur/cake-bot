import axios from 'axios';
import Medusa from 'medusajs';

import { Command, CommandFn } from '../interfaces';
import { random } from '../random';
import { RichEmbed } from 'discord.js';

const OTTER_URL = 'https://www.reddit.com/r/otterable/hot.json';
const CACHE_LENGTH = 3600;

const getOtter: CommandFn = async (params, msg) => {
  const serverId = msg.guild.id;

  const results = await axios.get(OTTER_URL);
  const {
    data: {
      data: { children: posts }
    }
  } = results;

  const lastOtterImage = await Medusa.get(
    `otterImage.${serverId}`,
    async (resolve: (value: any) => void) => {
      resolve(undefined);
    },
    CACHE_LENGTH
  );

  const acceptablePosts = posts.filter(
    (post: any) =>
      !post.data.stickied &&
      !post.data.over_18 &&
      post.data.url !== lastOtterImage &&
      (post.data.domain === 'i.redd.it' ||
        post.data.domain === 'gfycat.com' ||
        post.data.domain === 'i.imgur.com')
  );

  const selectedIndex = random(acceptablePosts.length);
  const selectedPost = acceptablePosts[selectedIndex];

  await Medusa.put(
    `otterImage.${serverId}`,
    selectedPost.data.url,
    CACHE_LENGTH
  );

  const postTitle = selectedPost.data.title;
  const postImage = selectedPost.data.url;
  const postUrl = `https://reddit.com${selectedPost.data.permalink}`;

  if (selectedPost.data.domain === 'gfycat.com') {
    return msg.channel.send(`**${postTitle}**\n${postImage}`);
  }

  const embed = new RichEmbed();
  embed.title = postTitle;
  embed.description = `[Source](${postUrl})`;
  embed.image = { url: postImage };

  return msg.channel.send(embed);
};

export const otter: Command = {
  description: 'Finds adorable otter pictures.',
  fn: getOtter,
  params: []
};
