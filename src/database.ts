import * as admin from 'firebase-admin';
import { config as loadEnv } from 'dotenv';
import moment from 'moment';

loadEnv();

const firebaseConfig = [
  'type',
  'project_id',
  'private_key_id',
  'private_key',
  'client_email',
  'client_id',
  'auth_uri',
  'token_uri',
  'auth_provider_x509_cert_url',
  'client_x509_cert_url'
].reduce(
  (config, key) => ({
    ...config,
    [key]: process.env[`FIREBASE_${key.toUpperCase()}`]
  }),
  {}
);

admin.initializeApp({
  credential: admin.credential.cert(firebaseConfig),
  databaseURL: process.env.FIREBASE_DATABASE_URL
});

const db = admin.database();
const ref = db.ref('/');

export const getNextAnnouncementDate = async () => {
  const data = await ref.child('announcementDate').once('value');
  return data.val();
};

export const setNextAnnouncementDate = (date: moment.Moment) => {
  const month = date.month();
  const day = date.date();
  ref.child('announcementDate').set({ month, day });
};

export const addServer = (server: string) => {
  const defaultData = {
    channel: null,
    listMessage: null,
    mentions: false
  };

  ref
    .child('servers')
    .child(server)
    .set(defaultData);
};

export const removeServer = (server: string) => {
  ref
    .child('servers')
    .child(server)
    .remove();

  ref
    .child('birthdays')
    .child(server)
    .remove();
};

export const getServers = async () => {
  const servers = await ref.child('servers').once('value');
  return servers.val();
};

export const setBirthday = async (
  server: string,
  user: string,
  date: moment.Moment
) => {
  const month = date.month();
  const day = date.date();

  await ref
    .child('birthdays')
    .child(server)
    .child(user)
    .set({ month, day });
};

export const removeBirthday = async (server: string, user: string) => {
  await ref
    .child('birthdays')
    .child(server)
    .child(user)
    .remove();
};

export const getBirthdays = async (
  server: string,
  month?: number,
  day?: number
) => {
  const serverUsersData = await ref
    .child('birthdays')
    .child(server)
    .once('value');
  const serverUsers = serverUsersData.val();
  if (!serverUsers) {
    return [];
  }

  const birthdays = Object.keys(serverUsers).reduce((result: any, user) => {
    const { month, day } = serverUsers[user];

    const currentMonth = result[month] || {};
    const currentDay = currentMonth[day] || [];

    currentDay.push(user);

    return {
      ...result,
      [month]: {
        ...result[month],
        [day]: currentDay
      }
    };
  }, {});

  if (month !== undefined && day !== undefined) {
    if (birthdays[month] && birthdays[month][day]) {
      return birthdays[month][day];
    } else {
      return [];
    }
  }

  return birthdays;
};

export const setServerChannel = (server: string, channel: string) => {
  ref
    .child('servers')
    .child(server)
    .child('channel')
    .set(channel);
};

export const getServerChannel = async (server: string) => {
  const channel = await ref
    .child('servers')
    .child(server)
    .child('channel')
    .once('value');
  return channel.val();
};

export const setServerListMessage = (server: string, msgId: string) => {
  ref
    .child('servers')
    .child(server)
    .child('listMessage')
    .set(msgId);
};

export const getServerListMessage = async (server: string) => {
  const msgId = await ref
    .child('servers')
    .child(server)
    .child('listMessage')
    .once('value');
  return msgId.val();
};

export const setServerMentions = (server: string, mentions: boolean) => {
  ref
    .child('servers')
    .child(server)
    .child('mentions')
    .set(mentions);
};

export const getServerMentions = async (server: string) => {
  const mentions = await ref
    .child('servers')
    .child(server)
    .child('mentions')
    .once('value');
  return mentions.val();
};
