import './rejection-handler';
import { orderBy } from 'lodash';
import { TrelloClient } from './trello-client';
import { tapWriteFile, tapWriteFileSync } from './helpers';
import { SlackClient } from './slack-client';

const ROTTEN_DAYS = 5;

async function main() {
  const client = new TrelloClient();
  const slackClient = new SlackClient();

  const lists = await client.getLists().then(data => tapWriteFile('lists.json', data));
  const cards = await client.getCards().then(data => tapWriteFile('cards.json', data));
  // const labels = await client.getLabels().then(data => tapWriteFile('labels.json', data));
  // const plugins = await client.getPlugins().then(data => tapWriteFile('plugins.json', data));
  // const members = await client.getMembers().then(data => tapWriteFile('members.json', data));
  // const checklists = await client.getChecklists().then(data => tapWriteFile('checklists.json', data));

  const rottenCards = cards
    .filter(card => card._daysFromLastActivity > ROTTEN_DAYS && !card._listName.includes('ANALYTICS'))
    .map(card => ({
      list: card._listName,
      card: card.name,
      daysFromLastActivity: card._daysFromLastActivity,
      listOrder: lists.find(l => l.id === card.idList)!.pos,
      cardOrder: card.pos,
    }));
  console.log('ROTTEN CARDS:', tapWriteFileSync('rotten_cards.json', orderBy(rottenCards, ['listOrder', 'cardOrder'], ['asc', 'asc'])));
  slackClient.postMessage(orderBy(rottenCards, ['listOrder', 'cardOrder'], ['asc', 'asc']).map(card => {
    delete card.listOrder;
    delete card.cardOrder;
    return card;
  }), '一定期間Activityのないカード');

  const releaseLists = cards
    .filter(card => card._listName.includes('RELEASE') && card._releaseStatus !== 'OK')
    .map(card => ({
      list: card._listName,
      card: card.name,
      releaseStatus: card._releaseStatus,
      listOrder: lists.find(l => l.id === card.idList)!.pos,
      cardOrder: card.pos,
    }));
  console.log('RELEASE LISTS:', tapWriteFileSync('release_lists.json', orderBy(releaseLists, ['listOrder', 'cardOrder'], ['asc', 'asc'])));
  slackClient.postMessage(orderBy(releaseLists, ['listOrder', 'cardOrder'], ['asc', 'asc']).map(list => {
    delete list.listOrder;
    delete list.cardOrder;
    return list;
  }), 'リリースリストの完了条件を満たしていないカード');
}

// entry point
main();
