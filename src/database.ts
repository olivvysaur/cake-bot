import * as admin from 'firebase-admin';
import { config as loadEnv } from 'dotenv';

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
  databaseURL: 'https://cake-bot-7d5de.firebaseio.com'
});

export const testFunction = () => 'Boop';
