import { Command, CommandFn } from '../interfaces';
import { announceFreeEpicGames } from '../jobs/epicGames';
import { deleteAfterDelay } from '../messages';
import { emoji } from '../emoji';

const makeAnnouncement: CommandFn = async (params, msg) => {
  await announceFreeEpicGames();
  const sentMessage = await msg.channel.send(
    `${emoji.success} Manually triggered Epic Games announcement.`
  );
  deleteAfterDelay(msg, sentMessage);
};

export const epicgames: Command = {
  description: 'Manually trigger the Epic Games announcement.',
  fn: makeAnnouncement,
  params: [],
  hidden: true,
  requiresMod: true
};
