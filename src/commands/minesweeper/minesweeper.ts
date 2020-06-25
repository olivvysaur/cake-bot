import { Command, CommandFn } from '../../interfaces';
import {
  createGameState,
  GameState,
  move,
  Direction,
  revealSquare,
  flagSquare,
} from './GameState';
import { range } from './utils';
import { HEIGHT, WIDTH, FLAG, COVERED, DEFAULT_MINES } from './constants';
import { Message, CollectorFilter, RichEmbed } from 'discord.js';
import moment from 'moment';

const TWO_MINUTES = 1000 * 60 * 2;

const drawBoard = (state: GameState) => {
  let grid = '';

  range(0, HEIGHT + 1).forEach((y) => {
    grid += '\n';

    if (y < HEIGHT) {
      range(0, WIDTH).forEach((x) => {
        const isCursor = state.cursorX === x && state.cursorY === y;

        grid += isCursor ? '{' : '\u200B\u00A0\u00A0';

        if (state.flagged[x][y]) {
          grid += FLAG;
        } else if (!state.revealed[x][y]) {
          grid += COVERED;
        } else {
          grid += state.board[x][y];
        }

        grid += isCursor ? '}' : '\u00A0\u00A0';
      });

      grid += '\n';
    }
  });

  return grid;
};

const playMinesweeper: CommandFn = async (params, msg) => {
  const playerId = msg.author.id;

  const minesParam = Number(params[0]);
  const mines =
    isNaN(minesParam) || minesParam === 0
      ? DEFAULT_MINES
      : Math.min(minesParam, WIDTH * HEIGHT);

  const startTime = moment();
  let moveCount = 0;
  let state = createGameState(mines);

  const board = drawBoard(state);

  const gameEmbed = new RichEmbed();
  gameEmbed.title = `🚩 ${mines}`;
  gameEmbed.description = board;

  const gameMsg = (await msg.channel.send(gameEmbed)) as Message;

  await gameMsg.react('◀️');
  await gameMsg.react('🔼');
  await gameMsg.react('🔽');
  await gameMsg.react('▶️');
  await gameMsg.react('🆗');
  await gameMsg.react('🚩');

  const filter: CollectorFilter = (reaction, user) =>
    ['◀️', '🔼', '🔽', '▶️', '🆗', '🚩'].includes(reaction.emoji.name) &&
    user.id === playerId;

  let finished = false;

  while (!finished) {
    const reactions = await gameMsg.awaitReactions(filter, {
      time: TWO_MINUTES,
      max: 1,
    });

    if (!!reactions && !!reactions.size) {
      moveCount += 1;

      const command = reactions.first().emoji.name;
      if (command === '◀️') {
        state = move(state, Direction.Left);
      }
      if (command === '🔼') {
        state = move(state, Direction.Up);
      }
      if (command === '🔽') {
        state = move(state, Direction.Down);
      }
      if (command === '▶️') {
        state = move(state, Direction.Right);
      }
      if (command === '🆗') {
        state = revealSquare(state, state.cursorX, state.cursorY);
      }
      if (command === '🚩') {
        state = flagSquare(state, state.cursorX, state.cursorY);
      }
      await reactions.first().remove(playerId);
    } else {
      finished = true;
    }

    const updatedBoard = drawBoard(state);

    let flagsUsed = 0;
    range(0, WIDTH).forEach((x) =>
      range(0, HEIGHT).forEach((y) => {
        if (state.flagged[x][y]) {
          flagsUsed += 1;
        }
      })
    );
    const flagCount = `🚩 ${Math.max(mines - flagsUsed, 0)}`;

    gameEmbed.title = flagCount;
    gameEmbed.description = updatedBoard;

    await gameMsg.edit(gameEmbed);

    finished = finished || state.completed || state.gameOver;
  }

  await gameMsg.clearReactions();

  const endTime = moment();
  const timeSpent = moment.duration(endTime.diff(startTime));
  const timeSpentAsString = `${timeSpent.minutes()}m ${timeSpent.seconds()}s`;

  gameEmbed.title = state.completed ? 'Winner!' : 'Game over';
  gameEmbed.setColor(state.completed ? '#408137' : '#d64834');
  gameEmbed.addField('Time spent', timeSpentAsString, true);
  gameEmbed.addField('Moves made', moveCount, true);

  await gameMsg.edit(gameEmbed);
};

export const minesweeper: Command = {
  fn: playMinesweeper,
  description: 'Play an interactive game of minesweeer.',
  params: [],
};
