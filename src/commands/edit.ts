import { TextChannel, Message } from 'discord.js';

import { Command, CommandFn } from '../interfaces';
import { deleteAfterDelay } from '../messages';
import { client } from '..';
import { emoji } from '../emoji';

const editMessage: CommandFn = async (params, msg) => {
  if (params.length < 1) {
    return;
  }

  const messageId = params[0];

  const serverChannels = msg.guild.channels;
  let success = false;
  let canEdit = true;
  let cancelled = false;
  await Promise.all(
    serverChannels
      .filter((channel) => channel.type === 'text')
      .map(async (channel) => {
        try {
          const textChannel = channel as TextChannel;
          const message = await textChannel.fetchMessage(messageId);
          if (message) {
            if (message.author.id === client.user.id) {
              success = true;
              await textChannel.send(
                'Here is the existing content, in case you need to copy and paste:'
              );
              await textChannel.send(`\`\`\`
${message.content}
\`\`\``);
              await textChannel.send(
                'Now what should the new content be? Reply with "cancel" to cancel.'
              );

              const messageFilter = (message: Message) =>
                message.author.id === msg.author.id;
              const response = await textChannel.awaitMessages(messageFilter, {
                time: 60000,
                maxMatches: 1,
              });
              if (
                !response ||
                !response.size ||
                response.first().content.toLowerCase() === 'cancel'
              ) {
                cancelled = true;
                return textChannel.send(`${emoji.error} Edit cancelled.`);
              }

              const newContent = response.first().content;
              await message.edit(newContent);
              await response.first().react(emoji.success);
            } else {
              canEdit = false;
            }
          }
        } catch (error) {
          return;
        }
      })
  );

  if (success || cancelled) {
    return;
  }

  const error = canEdit
    ? "I couldn't find that message."
    : "I can't edit messages I didn't send.";
  return msg.channel.send(`${emoji.error} ${error}`);
};

export const edit: Command = {
  params: ['messageID', 'text'],
  description: 'Edit a message sent by Cakebot.',
  hidden: true,
  fn: editMessage,
  requiresMod: true,
};
