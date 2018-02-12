import './rejection-handler';
import { orderBy } from 'lodash';
import * as moment from 'moment';
import { TrelloClient } from './trello-client';
import { SlackClient } from './slack-client';
import { tapWriteFile, tapWriteFileSync } from './helpers';
import { getRottenCards, getIncompleteReleaseCards, getReleaseCardsMetrix } from './actions';

const ROTTEN_DAYS = 5;

async function main() {
  const trelloClient = new TrelloClient();
  const slackClient = new SlackClient();

  const board = await trelloClient.getBoard().then(data => tapWriteFile('board.json', data));
  const lists = await trelloClient.getLists().then(data => tapWriteFile('lists.json', data));
  const cards = await trelloClient.getCards().then(data => tapWriteFile('cards.json', data));

  await slackClient.postMessage(`${'='.repeat(50)}\nMessage from Bot: ${moment().format('LLL')}\n${'='.repeat(50)}`);

  const rottenCards = getRottenCards(cards, lists, ROTTEN_DAYS);
  console.log('ROTTEN CARDS:', tapWriteFileSync('rotten_cards.json', rottenCards));
  rottenCards.length > 0
    ? await slackClient.postMessageWithMention(rottenCards, '一定期間アクティビティのないカード')
    : await slackClient.postMessage(rottenCards, '一定期間アクティビティのないカード');

  const incompleteReleaseCards = getIncompleteReleaseCards(cards, lists);
  console.log('INCOMPLETE RELEASE CARDS:', tapWriteFileSync('incomplete_release_cards.json', incompleteReleaseCards));
  incompleteReleaseCards.length > 0
    ? await slackClient.postMessageWithMention(incompleteReleaseCards, 'RELEASEリストの完了条件を満たしていないカード')
    : await slackClient.postMessage(incompleteReleaseCards, 'RELEASEリストの完了条件を満たしていないカード');

  const releaseCardsMetrix = getReleaseCardsMetrix(cards, lists);
  console.log('RELEASE CARDS METRIX:', tapWriteFileSync('release_cards_metrix.json', releaseCardsMetrix));
  await slackClient.postMessage(releaseCardsMetrix, 'RELEASEリストのメトリクス');
}

// entry point
main();
