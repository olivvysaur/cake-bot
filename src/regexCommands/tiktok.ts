import { Message, RichEmbed } from 'discord.js';
import Axios from 'axios';
import { parse } from 'node-html-parser';

import { RegexCommand } from '../interfaces';

const REGEX = /https:\/\/((www)|(vm))\.tiktok\.com\/[\w\/@]+/gi;

const formatNumber = (number: number) => {
  const thresholds = [
    { value: 1_000_000, unit: 'M' },
    { value: 1_000, unit: 'K' },
  ];

  const metThreshold = thresholds.find(
    (threshold) => number >= threshold.value
  );

  if (!metThreshold) {
    return number.toString();
  }

  const divided = number / metThreshold.value;
  return `${divided.toFixed(1)}${metThreshold.unit}`;
};

const fetchVideo = async (msg: Message) => {
  const match = msg.content.match(REGEX);
  if (!match) {
    return;
  }

  const url = match[0];

  const response = await Axios.get(url, {
    headers: {
      'User-Agent':
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_10_1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/39.0.2171.95 Safari/537.36',
    },
  });
  if (response.status !== 200) {
    return;
  }

  const root = parse(response.data);

  const scriptTag = root.querySelector('script#__NEXT_DATA__');
  if (!scriptTag) {
    return;
  }

  const props = JSON.parse(scriptTag.innerText).props?.pageProps;

  const {
    seoProps: {
      metaParams: { canonicalHref },
    },
    itemInfo: {
      itemStruct: {
        desc: description,
        createTime,
        video: { downloadAddr, cover },
        author: { uniqueId: authorUsername, nickname: authorName },
        music: { title: musicTitle, authorName: musicAuthor },
        stats: { playCount, diggCount: likeCount },
      },
    },
  } = props;

  const embedDescription = `
${description}

:musical_note:  ${musicTitle} - ${musicAuthor}

:eye:  ${formatNumber(playCount)}
:heart:  ${formatNumber(likeCount)}
`;

  const embed = new RichEmbed()
    .setTitle(`${authorName} (@${authorUsername})`)
    .setDescription(embedDescription)
    .setImage(cover)
    .setTimestamp(createTime * 1000);

  return msg.channel.send(embed);
};

export const tiktok: RegexCommand = {
  trigger: REGEX,
  fn: fetchVideo,
};
