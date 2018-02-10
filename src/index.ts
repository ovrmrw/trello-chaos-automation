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
  console.log('IMCOMPLETE RELEASE CARDS:', tapWriteFileSync('incomplete_release_cards.json', orderBy(incompleteReleaseCards, ['listOrder', 'cardOrder'], ['asc', 'asc'])));
  await slackClient.postMessage(orderBy(incompleteReleaseCards, ['listOrder', 'cardOrder'], ['asc', 'asc']).map(card => {
    delete card.listOrder;
    delete card.cardOrder;
    return card;
  }), 'リリースリストの完了条件を満たしていないカード');

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
          p[card.list] = { cards: 0, sp_sum: 0, leadtime_sum: 0, leadtime_ave: 0 };
        }
        p[card.list].cards += 1;
        p[card.list].sp_sum += card.sp;
        p[card.list].leadtime_sum += card.leadtime;
        return p;
      }, {} as any);
    Object.entries(releaseCards).forEach(([key, obj]) => {
      releaseCards[key].leadtime_ave = obj.leadtime_sum / obj.cards;
    });
    console.log('RELEASE CARDS:', tapWriteFileSync('release_cards_metrix.json', releaseCards));
    await slackClient.postMessage(releaseCards, 'リリースリストのメトリクス');
  }
}

// entry point
main();
