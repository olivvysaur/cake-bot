import { RichEmbed } from 'discord.js';
import { emoji } from '../emoji';
import { Command, CommandFn } from '../interfaces';
import { random } from '../random';

const chooseItem: CommandFn = (params, msg) => {
  const items = params.join(' ').split(' / ');

  if (items.length <= 1) {
    return msg.channel.send(
      `${emoji.error} You need to specify a list of at least two items, separated by slashes \`/\`.`
    );
  }

  const chosenIndex = random(items.length);
  const chosenItem = items[chosenIndex];

  const embed = new RichEmbed();
  embed.title = 'I choose...';
  embed.description = chosenItem;

  return msg.channel.send(embed);
};

export const choose: Command = {
  description: 'Pick an item at random from a list.',
  params: ['items'],
  fn: chooseItem,
};
