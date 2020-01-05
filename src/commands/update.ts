import { Message } from 'discord.js';

import { CommandFn, Command } from '../interfaces';
import { updateList } from '../updateList';
import { emoji } from '../emoji';

const runUpdate: CommandFn = async (params, msg) => {
  const server = msg.guild.id;

  await updateList(server);

  const sentMessage = await msg.channel.send(
    `${emoji.success} Birthday list updated!`
  );
  setTimeout(() => {
    msg.delete();
    (sentMessage as Message).delete();
  }, 5000);
};

export const update: Command = {
  params: [],
  description: 'Refreshes the birthday list to update nicknames.',
  fn: runUpdate
};
