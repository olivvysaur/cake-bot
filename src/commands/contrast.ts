import Color from 'color';
import { RichEmbed } from 'discord.js';

import { Command, CommandFn } from '../interfaces';
import { DISCORD_BG_COLOUR, CONTRAST_THRESHOLD } from '../constants';
import { emoji } from '../emoji';
import { notUndefined } from '../notUndefined';

const HEX_REGEX = /#?[A-Fa-f0-9]{6}$/;

const showColourContrast: CommandFn = (params, msg) => {
  const queryColours = params.slice(0, 2).map(c => {
    try {
      if (c.match(HEX_REGEX)) {
        if (c.startsWith('#')) {
          return Color(c);
        } else {
          return Color(`#${c}`);
        }
      } else {
        return Color(c);
      }
    } catch {
      msg.channel.send(`${emoji.error} ${c} is not a valid colour.`);
      return undefined;
    }
  });

  if (queryColours.includes(undefined)) {
    return;
  }

  const requestedColours = queryColours.filter(notUndefined);

  const colours =
    requestedColours.length === 2
      ? requestedColours
      : [requestedColours[0], DISCORD_BG_COLOUR];
  const contrast = colours[0].contrast(colours[1]);

  const contrastString = contrast.toFixed(2);
  const contrastEmoji =
    contrast >= CONTRAST_THRESHOLD ? emoji.success : emoji.error;

  const embed = new RichEmbed();
  embed.title = `Colour contrast for ${colours[0].hex()} and ${colours[1].hex()}`;
  embed.description = `${contrastEmoji} ${contrastString}`;
  embed.setColor(colours[0].mix(colours[1]).hex());
  embed.footer = { text: `Minimum for WCAG 2.1 AA is ${CONTRAST_THRESHOLD}` };

  return msg.channel.send(embed);
};

export const contrast: Command = {
  description: 'Show the colour contrast between two colours.',
  fn: showColourContrast,
  params: ['colour 1', 'colour 2']
};
