import Medusa from 'medusajs';
import { DB } from './database';
import { client } from '.';
import {
  GuildMember,
  RichEmbed,
  Attachment,
  FileOptions,
  TextChannel,
  User
} from 'discord.js';

const CACHE_LENGTH = 86400 * 1000;

const getLogChannel = async (serverId: string) => {
  const channelId = await Medusa.get(
    `logging.${serverId}`,
    async (resolve: (value: any) => void) => {
      const retrieved = await DB.getPath(`/logging/${serverId}`);
      resolve(retrieved);
    },
    CACHE_LENGTH
  );

  if (!channelId) {
    return undefined;
  }

  const channel = client.channels.get(channelId);
  if (!channel) {
    console.error(
      `[logging] Server ${serverId} has log channel set to ${channelId} but the channel does not exist. Disabling logging for the server.`
    );
    await DB.deletePath(`/logging/${serverId}`);
    await Medusa.put(`logging.${serverId}`, null, CACHE_LENGTH);
    return undefined;
  }

  return channel;
};

export interface LogOptions {
  user?: GuildMember;
  userId?: string;
  color?: string;
  attachment?: string | Attachment | FileOptions;
  iconUrl?: string;
  author?: User;
  customFields?: { name: string; value: any }[];
}

export class Log {
  static send = async (
    title: string,
    message: string,
    serverId: string,
    options: LogOptions = {}
  ) => {
    const logChannel = await getLogChannel(serverId);
    if (!logChannel) {
      return;
    }

    const embed = new RichEmbed();
    embed.title = title;
    embed.description = !!message ? `${message}\n\u200B` : undefined;
    embed.timestamp = new Date();

    if (!!options.color) {
      embed.setColor(options.color);
    }

    if (!!options.user) {
      const {
        nickname,
        user: { tag }
      } = options.user;

      const displayName = !!nickname ? `${nickname} (${tag})` : tag;

      embed.author = {
        name: displayName,
        icon_url: options.user.user.avatarURL
      };
      embed.footer = { text: `User ID: ${options.user.user.id}` };
    }

    if (!!options.author) {
      embed.author = {
        name: options.author.tag,
        icon_url: options.author.displayAvatarURL
      };
    }

    if (!!options.attachment) {
      embed.attachFile(options.attachment);
    }

    if (!!options.customFields) {
      options.customFields.forEach(field => {
        embed.addField(field.name, field.value, false);
      });
    }

    return (logChannel as TextChannel).send(embed);
  };

  static color = (color: string) => async (
    title: string,
    message: string,
    serverId: string,
    options: LogOptions = {}
  ) => {
    return Log.send(title, message, serverId, { ...options, color });
  };

  static red = Log.color('#d64834');
  static orange = Log.color('#e99a41');
  static yellow = Log.color('#f1e555');
  static green = Log.color('#408137');
  static blue = Log.color('#385fe1');
  static purple = Log.color('#8c3da0');
}
