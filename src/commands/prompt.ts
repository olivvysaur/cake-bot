import { Message, CollectorFilter, RichEmbed } from 'discord.js';

import { Command, CommandFn } from '../interfaces';
import { DB } from '../database';
import { PREFIX } from '../constants';
import { deleteAfterDelay } from '../messages';

const random = (max: number) => Math.floor(Math.random() * max);

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

    let reply = '';

    if (typeof selectedPrompt === 'string') {
      reply = `You should draw... ${selectedPrompt}.`;
    } else {
      const { prompt, user } = selectedPrompt;
      try {
        const promptAuthor = await server.fetchMember(user);
        const authorDisplayName = promptAuthor.displayName;
        reply = `You should draw... ${prompt}.\n(suggested by ${authorDisplayName})`;
      } catch (e) {
        reply = `You should draw... ${prompt}.`;
      }
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
    sentMessage.clearReactions();
    if (!!reactions && !!reactions.size) {
      if (reactions.first().emoji.name === '♻️') {
        await DB.pushAtPath(`prompts/${serverId}`, selectedPrompt);

        const newMessageContent = `Prompt re-added to the suggestion pile.`;
        await sentMessage.edit(newMessageContent);

        deleteAfterDelay(sentMessage, msg);
      }
    }
    return;
  }

  if (params.length === 1 && params[0].toLowerCase() === 'count') {
    const serverPrompts = await DB.getPath(`prompts/${serverId}`);
    if (!serverPrompts || !Object.keys(serverPrompts).length) {
      return channel.send("There aren't any prompts saved at the moment. 😔");
    }

    const count = Object.keys(serverPrompts).length;
    if (count === 1) {
      return channel.send('There is currently 1 prompt saved.');
    } else {
      return channel.send(`There are currently ${count} prompts saved.`);
    }
  }

  if (params.length === 1 && params[0].toLowerCase() === '$analysis') {
    const serverPrompts = await DB.getPath(`prompts/${serverId}`);
    if (!serverPrompts || !Object.keys(serverPrompts).length) {
      return channel.send("There aren't any prompts saved at the moment. 😔");
    }

    const count = Object.keys(serverPrompts).length;

    const untaggedCount = Object.values(serverPrompts).filter(
      prompt => typeof prompt === 'string'
    ).length;
    const taggedCount = Object.values(serverPrompts).filter(
      prompt => typeof prompt !== 'string'
    ).length;

    const completionRatio = ((taggedCount / count) * 100)
      .toFixed(2)
      .replace('.00', '');

    const embed = new RichEmbed();
    embed.title = 'Prompt analysis';
    embed.addField('Total prompts', count, true);
    embed.addField('Tagged prompts', taggedCount, true);
    embed.addField('Untagged prompts', untaggedCount, true);
    embed.addField('Completion', `${completionRatio}%`, true);

    return channel.send(embed);
  }

  const promptToAdd = params.join(' ');
  const senderId = msg.author.id;
  await DB.pushAtPath(`prompts/${serverId}`, {
    prompt: promptToAdd,
    user: senderId
  });

  const sentMessage = await channel.send(`✅ Got it!`);
  deleteAfterDelay(msg, sentMessage);
};

export const prompt: Command = {
  description: `Gets a random drawing prompt using "${PREFIX}prompt" or saves a new drawing prompt, e.g. "${PREFIX}prompt sleeping tiger".`,
  params: [],
  fn: promptCommand
};
