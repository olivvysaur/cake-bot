import { Command } from '../interfaces';

import { help } from './help';
import { ping } from './ping';
import { list } from './list';
import { set } from './set';
import { channel } from './channel';
import { mentions } from './mentions';

export const COMMANDS: { [code: string]: Command } = {
  help,
  // ping,
  list,
  set,
  channel
  // mentions
};
