import { Command } from '../interfaces';

import { help } from './help';
import { ping } from './ping';
import { list } from './list';
import { set } from './set';
import { mentions } from './mentions';
import { channel } from './channel';

export const COMMANDS: { [code: string]: Command } = {
  help,
  ping,
  list,
  set,
  channel,
  mentions
};
