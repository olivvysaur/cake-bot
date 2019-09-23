import { Command } from '../interfaces';

import { help } from './help';
import { ping } from './ping';
import { list } from './list';
import { set } from './set';
import { update } from './update';
import { channel } from './channel';
import { mentions } from './mentions';
import { role } from './role';

export const COMMANDS: { [code: string]: Command } = {
  help,
  // ping,
  // list,
  set,
  update,
  channel,
  // mentions,
  role
};
