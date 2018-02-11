import './rejection-handler';
import { orderBy } from 'lodash';
import * as moment from 'moment';
import { TrelloClient } from './trello-client';
import { tapWriteFile, tapWriteFileSync } from './helpers';
import { SlackClient } from './slack-client';

const ROTTEN_DAYS = 5;

async function main() {
  const trelloClient = new TrelloClient();
  const slackClient = new SlackClient();

  const board = await trelloClient.getBoard().then(data => tapWriteFile('board.json', data));
  const lists = await trelloClient.getLists().then(data => tapWriteFile('lists.json', data));
  const cards = await trelloClient.getCards().then(data => tapWriteFile('cards.json', data));
  // const labels = await client.getLabels().then(data => tapWriteFile('labels.json', data));
  // const plugins = await client.getPlugins().then(data => tapWriteFile('plugins.json', data));
  // const members = await client.getMembers().then(data => tapWriteFile('members.json', data));
  // const checklists = await client.getChecklists().then(data => tapWriteFile('checklists.json', data));

  await slackClient.postMessage(`${'='.repeat(50)}\nMessage from Bot: ${moment().format('LLL')}\n${'='.repeat(50)}`);

  const rottenCards = cards
    .filter(card => card._daysFromLastActivity > ROTTEN_DAYS && !card._listName.includes('ANALYTICS'))
    .map(card => ({
      list: card._listName,
      card: card.name,
      daysFromLastActivity: card._daysFromLastActivity,
      listOrder: lists.find(list => list.id === card.idList)!.pos,
      cardOrder: card.pos,
    }));
  console.log('ROTTEN CARDS:', tapWriteFileSync('rotten_cards.json', orderBy(rottenCards, ['listOrder', 'cardOrder'], ['asc', 'asc'])));
  await slackClient.postMessage(orderBy(rottenCards, ['listOrder', 'cardOrder'], ['asc', 'asc']).map(card => {
    delete card.listOrder;
    delete card.cardOrder;
    return card;
  }), '一定期間アクティビティのないカード');

  const incompleteReleaseCards = cards
    .filter(card => card._listName.includes('RELEASE') && card._releaseStatus !== 'OK')
    .map(card => ({
      list: card._listName,
      card: card.name,
      releaseStatus: card._releaseStatus,
      listOrder: lists.find(list => list.id === card.idList)!.pos,
      cardOrder: card.pos,
    }));
  console.log('INCOMPLETE RELEASE CARDS:', tapWriteFileSync('incomplete_release_cards.json', orderBy(incompleteReleaseCards, ['listOrder', 'cardOrder'], ['asc', 'asc'])));
  await slackClient.postMessage(orderBy(incompleteReleaseCards, ['listOrder', 'cardOrder'], ['asc', 'asc']).map(card => {
    delete card.listOrder;
    delete card.cardOrder;
    return card;
  }), 'RELEASEリストの完了条件を満たしていないカード');

  if (incompleteReleaseCards.length === 0) {
    const releaseCards = cards
      .filter(card => card._listName.includes('RELEASE'))
      .map(card => ({
        list: card._listName,
        sp: card._storyPoint,
        leadtime: card._leadtime,
      }))
      .reduce((p, card) => {
        if (!p[card.list]) {
          const NEGATIVE = Number.NEGATIVE_INFINITY;
          const POSITIVE = Number.POSITIVE_INFINITY;
          p[card.list] = { cards: 0, sp_sum: 0, sp_min: POSITIVE, sp_max: NEGATIVE, leadtime_avg: 0, leadtime_sum: 0, leadtime_min: POSITIVE, leadtime_max: NEGATIVE };
        }
        p[card.list].cards += 1;
        p[card.list].sp_sum += card.sp;
        p[card.list].sp_min = p[card.list].sp_min > card.sp! ? card.sp : p[card.list].sp_min;
        p[card.list].sp_max = p[card.list].sp_max < card.sp! ? card.sp : p[card.list].sp_max;
        p[card.list].leadtime_sum += card.leadtime;
        p[card.list].leadtime_min = p[card.list].leadtime_min > card.leadtime! ? card.leadtime : p[card.list].leadtime_min;
        p[card.list].leadtime_max = p[card.list].leadtime_max < card.leadtime! ? card.leadtime : p[card.list].leadtime_max;
        return p;
      }, {} as any);
    Object.entries(releaseCards).forEach(([key, obj]) => {
      releaseCards[key].leadtime_avg = obj.leadtime_sum / obj.cards;
    });
    console.log('RELEASE CARDS METRIX:', tapWriteFileSync('release_cards_metrix.json', releaseCards));
    await slackClient.postMessage(releaseCards, 'RELEASEリストのメトリクス');
  }
}

// entry point
main();
