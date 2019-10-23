import { Command, CommandFn } from '../interfaces';
import { DB } from '../database';
import { PREFIX } from '../constants';
import { deleteAfterDelay } from '../messages';
import { pluralise } from '../strings';

const promptCommand: CommandFn = async (params, msg) => {
  const serverId = msg.guild.id;
  const channel = msg.channel;

  const serverPrompts = await DB.getArrayAtPath(`prompts/${serverId}`);

  if (params.length === 0) {
    if (!serverPrompts.length) {
      return channel.send("There aren't any prompts saved at the moment. 😔");
    }

    const chosenIndex = Math.floor(Math.random() * serverPrompts.length);
    const selectedPrompt = serverPrompts[chosenIndex];

    const updatedPromptList = serverPrompts.filter(
      prompt => prompt !== selectedPrompt
    );
    await DB.setPath(`prompts/${serverId}`, updatedPromptList);

    const newCount = updatedPromptList.length;
    const newCountMessage = `(${pluralise(newCount, 'prompt')} left)`;

    return channel.send(
      `You should draw... ${selectedPrompt}.\n${newCountMessage}`
    );
  }

  const promptToAdd = params.join(' ');
  await DB.pushAtPath(`prompts/${serverId}`, promptToAdd);

  const newCount = serverPrompts.length + 1;
  const newCountMessage = `${pluralise(newCount, 'prompt')} saved.`;

  const sentMessage = await channel.send(`✅ Got it! ${newCountMessage}`);
  deleteAfterDelay(msg, sentMessage);
};

export const prompt: Command = {
  description: `Gets a random drawing prompt using "${PREFIX}prompt" or saves a new drawing prompt, e.g. "${PREFIX}prompt sleeping tiger".`,
  params: [],
  fn: promptCommand
};
