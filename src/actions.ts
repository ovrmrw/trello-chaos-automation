import { orderBy } from 'lodash';
import { CardModel, ListModel } from './types';

export function getRottenCards(cards: CardModel[], lists: ListModel[], rottenDays: number) {
  const rottenCards = cards
    .filter(card => card._daysFromLastActivity > rottenDays && !card._listName.includes('ANALYTICS'))
    .map(card => ({
      list: card._listName,
      card: card.name,
      daysFromLastActivity: card._daysFromLastActivity,
      listOrder: lists.find(list => list.id === card.idList)!.pos,
      cardOrder: card.pos,
    }));
  return orderBy(rottenCards, ['listOrder', 'cardOrder'], ['asc', 'asc'])
    .map(card => {
      delete card.listOrder;
      delete card.cardOrder;
      return card;
    });
}

export function getIncompleteReleaseCards(cards: CardModel[], lists: ListModel[]) {
  const incompleteReleaseCards = cards
    .filter(card => card._listName.includes('RELEASE') && card._releaseStatus !== 'OK')
    .map(card => ({
      list: card._listName,
      card: card.name,
      releaseStatus: card._releaseStatus,
      listOrder: lists.find(list => list.id === card.idList)!.pos,
      cardOrder: card.pos,
    }));
  return orderBy(incompleteReleaseCards, ['listOrder', 'cardOrder'], ['asc', 'asc'])
    .map(card => {
      delete card.listOrder;
      delete card.cardOrder;
      return card;
    });
}

export function getReleaseCardsMetrix(cards: CardModel[], lists: ListModel[]) {
  const incompleteReleaseCards = getIncompleteReleaseCards(cards, lists);
  if (incompleteReleaseCards.length > 0) {
    return {
      error: (incompleteReleaseCards.length === 1
        ? `${incompleteReleaseCards.length} card is`
        : `${incompleteReleaseCards.length} cards are`) + ' incomplete to release.'
    };
  }
  const releaseCardsMetrix = cards
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
  Object.entries(releaseCardsMetrix).forEach(([key, obj]) => {
    releaseCardsMetrix[key].leadtime_avg = obj.leadtime_sum / obj.cards;
  });
  return releaseCardsMetrix;
}
