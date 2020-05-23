import { TextChannel } from 'discord.js';

import { Command, CommandFn } from '../interfaces';
import { deleteAfterDelay } from '../messages';
import { client } from '..';
import { emoji } from '../emoji';

const editMessage: CommandFn = async (params, msg) => {
  if (params.length < 2) {
    return;
  }

  const messageId = params[0];
  const newContent = params.slice(1).join(' ');

  const serverChannels = msg.guild.channels;
  let success = false;
  let canEdit = true;
  await Promise.all(
    serverChannels
      .filter((channel) => channel.type === 'text')
      .map(async (channel) => {
        try {
          const message = await (channel as TextChannel).fetchMessage(
            messageId
          );
          if (message) {
            if (message.author.id === client.user.id) {
              message.edit(newContent);
              success = true;
            } else {
              canEdit = false;
            }
          }
        } catch (error) {
          return;
        }
      })
  );

  if (success) {
    await msg.react(emoji.success);
    deleteAfterDelay(msg);
  } else {
    const error = canEdit
      ? "I couldn't find that message."
      : "I can't edit messages I didn't send.";
    const sentMessage = await msg.channel.send(`${emoji.error} ${error}`);
    deleteAfterDelay(msg, sentMessage);
  }
};

export const edit: Command = {
  params: ['messageID', 'text'],
  description: 'Edit a message sent by Cakebot.',
  hidden: true,
  fn: editMessage,
  requiresMod: true,
};
