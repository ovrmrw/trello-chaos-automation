import * as assert from 'assert';

const trelloSecretJson = require('../trello-secret.json');
const key: string = trelloSecretJson.apiKey || '';
const token: string = trelloSecretJson.token || '';
const boardId: string = trelloSecretJson.boardId || '';
assert(!!key, 'key is not defined.');
assert(!!token, 'token is not defined.');
assert(!!boardId, 'boardId is not defined.');

const slackSecretJson = require('../slack-secret.json');
const webhookUrl: string = slackSecretJson.webhookUrl || '';
const whoToMention: string[] = slackSecretJson.whoToMention || [];
assert(!!webhookUrl, 'webhookUrl is not defined.');

export const trelloConfig = Object.freeze({
  key,
  token,
  boardId,
});

export const slackConfig = Object.freeze({
  webhookUrl,
  whoToMention,
});
