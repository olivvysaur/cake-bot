import { Command, CommandFn } from '../interfaces';
import { announceFreeEpicGames } from '../jobs/epicGames';
import { deleteAfterDelay } from '../messages';
import { emoji } from '../emoji';
import { pluralise } from '../strings';

const makeAnnouncement: CommandFn = async (params, msg) => {
  const force = !!(params[0]?.toLowerCase() === 'force');

  const result = await announceFreeEpicGames(force);

  const resultMessage =
    result === -1
      ? 'an error occurred'
      : `${pluralise(result, 'game')} announced`;

  const sentMessage = await msg.channel.send(
    `${emoji.success} Manually triggered Epic Games announcement - ${resultMessage}.`
  );
  deleteAfterDelay(msg, sentMessage);
};

export const epicgames: Command = {
  description: 'Manually trigger the Epic Games announcement.',
  fn: makeAnnouncement,
  params: [],
  hidden: true,
  requiresMod: true,
};
