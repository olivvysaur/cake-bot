import { Command, CommandFn } from '../interfaces';
import { random } from '../random';
import { RichEmbed } from 'discord.js';

const POSITIVE_RESPONSES = [
  'It is certain.',
  'It is decidedly so.',
  'Without a doubt.',
  'You may rely on it.',
  'As I see it, yes.',
  'Most likely.',
  'Outlook good.',
  'Yes.',
  'Signs point to yes.'
];

const NEUTRAL_RESPONSES = [
  'Reply hazy, try again.',
  'Ask again later.',
  "I'd rather get *your* opinion.",
  'Cannot predict now.',
  'Concentrate and ask again.'
];

const NEGATIVE_RESPONSES = [
  "Don't count on it.",
  'My reply is no.',
  'My sources say no.',
  'Outlook not so good.',
  'Very doubtful.'
];

const getResponse: CommandFn = (params, msg) => {
  const text = msg.content;

  const forceNegative = text.endsWith(' ?');

  const responsePool = forceNegative
    ? NEGATIVE_RESPONSES
    : [...POSITIVE_RESPONSES, ...NEUTRAL_RESPONSES, ...NEGATIVE_RESPONSES];

  const selectedIndex = random(responsePool.length);
  const response = responsePool[selectedIndex];

  const responseIsNegative =
    forceNegative || NEGATIVE_RESPONSES.includes(response);
  const responseIsNeutral = NEUTRAL_RESPONSES.includes(response);

  const colour = responseIsNegative
    ? '#ff1f1f'
    : responseIsNeutral
    ? '#ffd700'
    : '#60b643';

  const embed = new RichEmbed();
  embed.description = response;
  embed.setColor(colour);

  return msg.channel.send(embed);
};

export const eightBall: Command = {
  description: 'Asks the oracle for an answer to a yes or no question.',
  fn: getResponse,
  params: ['question']
};
