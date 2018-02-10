const trelloConfig = require('../trello-secret.json');
const key: string = trelloConfig.apiKey || '';
const token: string = trelloConfig.token || '';
const boardId: string = trelloConfig.boardId || '';

const slackConfig = require('../slack-secret.json');
const webhookUrl: string = slackConfig.webhookUrl || '';

const trello = {
  key,
  token,
  boardId
};

const slack = {
  webhookUrl,
};

export { trello, slack };
