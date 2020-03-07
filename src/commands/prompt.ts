import { Message, CollectorFilter, RichEmbed } from 'discord.js';
import _ from 'lodash';

import { Command, CommandFn } from '../interfaces';
import { DB } from '../database';
import { PREFIX } from '../constants';
import { deleteAfterDelay } from '../messages';
import { emoji } from '../emoji';
import { random } from '../random';

const TEN_MINUTES = 1000 * 60 * 10;

const promptCommand: CommandFn = async (params, msg) => {
  const server = msg.guild;
  const serverId = server.id;
  const channel = msg.channel;

  if (params.length === 0) {
    const serverPrompts = await DB.getPath(`prompts/${serverId}`);
    if (!serverPrompts || !Object.keys(serverPrompts).length) {
      return channel.send("There aren't any prompts saved at the moment. 😔");
    }

    const keys = Object.keys(serverPrompts);

    const chosenIndex = random(keys.length);
    const selectedKey = keys[chosenIndex];
    const selectedPrompt = serverPrompts[selectedKey];

    await DB.deletePath(`prompts/${serverId}/${selectedKey}`);

    let reply = new RichEmbed();

    if (typeof selectedPrompt === 'string') {
      reply.description = `You should draw... ${selectedPrompt}.`;
    } else {
      const { prompt, user } = selectedPrompt;
      reply.description = `You should draw... ${prompt}.`;
      reply.addField(`Suggested by`, `<@${user}>`, true);
    }

    const requesterId = msg.author.id;

    const sentMessage = (await msg.channel.send(reply)) as Message;
    await sentMessage.react('✏️');
    await sentMessage.react('♻️');

    const filter: CollectorFilter = (reaction, user) =>
      (reaction.emoji.name === '✏️' || reaction.emoji.name === '♻️') &&
      user.id === requesterId;

    const reactions = await sentMessage.awaitReactions(filter, {
      time: TEN_MINUTES,
      max: 1
    });

    if (!!reactions && !!reactions.size) {
      if (reactions.first().emoji.name === '♻️') {
        sentMessage.reactions
          .filter(reaction => reaction.emoji.name !== '♻️')
          .forEach(reaction => reaction.remove());
        await DB.pushAtPath(`prompts/${serverId}`, selectedPrompt);
        await sentMessage.edit(`Prompt re-added to the suggestion pile.`);
      }

      if (reactions.first().emoji.name === '✏️') {
        sentMessage.reactions
          .filter(reaction => reaction.emoji.name !== '✏️')
          .forEach(reaction => reaction.remove());
      }
    } else {
      sentMessage.reactions
        .filter(reaction => reaction.emoji.name !== '✏️')
        .forEach(reaction => reaction.remove());
    }
    return;
  }

  if (params.length === 1 && params[0].toLowerCase() === 'count') {
    const serverPrompts = await DB.getPath(`prompts/${serverId}`);
    if (!serverPrompts || !Object.keys(serverPrompts).length) {
      return channel.send("There aren't any prompts saved at the moment. 😔");
    }

    const count = Object.keys(serverPrompts).length;

    const promptsByUser = _.groupBy(serverPrompts, prompt => prompt.user);
    const countByUser: { [user: string]: any[] } = Object.keys(
      promptsByUser
    ).reduce(
      (out, user) => ({
        ...out,
        [user]: promptsByUser[user].length
      }),
      {}
    );

    const sortedCounts = _.sortBy(
      Object.keys(countByUser),
      (user: string) => countByUser[user]
    );

    const list = sortedCounts
      .reverse()
      .map(user =>
        user !== 'undefined'
          ? `${countByUser[user]} - <@${user}>`
          : `${countByUser[user]} - unknown`
      )
      .join('\n');

    const embed = new RichEmbed();
    embed.title = 'Prompt count';
    embed.addField('Total prompts', count);
    embed.addField('Prompts by user', list);
    return channel.send(embed);
  }

  const promptToAdd = params.join(' ');
  const senderId = msg.author.id;
  await DB.pushAtPath(`prompts/${serverId}`, {
    prompt: promptToAdd,
    user: senderId
  });

  const sentMessage = await channel.send(`${emoji.success} Got it!`);
  deleteAfterDelay(msg, sentMessage);
};

export const prompt: Command = {
  description: `Gets a random drawing prompt using "${PREFIX}prompt" or saves a new drawing prompt, e.g. "${PREFIX}prompt sleeping tiger".`,
  params: [],
  fn: promptCommand
};
