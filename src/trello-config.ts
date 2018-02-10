const config = require('../trello-secret');
const key: string = config.apiKey || '';
const token: string = config.token || '';
const boardId: string = config.boardId || '';

export { key, token, boardId };
