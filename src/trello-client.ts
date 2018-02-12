import axios from 'axios';
import * as moment from 'moment';
import { URL } from 'url';
import { BoardModel, ListModel, CardModel, LabelModel, PluginDataModel, MemberModel, CheckListModel } from './types';
import { PluginData } from './plugindata';
import { trelloConfig } from './config';

const { key, token, boardId } = trelloConfig;
const FROM_EPIC_LABEL = 'from epic';
const FROM_ISSUE_LABEL = 'from issue';

export class TrelloClient {
  private board: BoardModel | undefined;
  private lists: ListModel[] | undefined;

  private getURL(endpoint: string): URL {
    const url = new URL(endpoint);
    url.searchParams.set('key', key);
    url.searchParams.set('token', token);
    return url;
  }

  getBoard(): Promise<BoardModel> {
    if (this.board) {
      return Promise.resolve(this.board);
    }
    const endpoint = `https://api.trello.com/1/boards/${boardId}`;
    const url = this.getURL(endpoint);
    url.searchParams.set('lists', 'all');
    url.searchParams.set('pluginData', 'true');
    return axios.get(url.href)
      .then(res => {
        return res.data as BoardModel;
      })
      .then(board => {
        return {
          ...board,
          pluginData: board.pluginData.map(data => {
            try {
              const value = JSON.parse(data.value);
              return { ...data, value };
            } catch (err) {
              return data;
            }
          })
        };
      })
      .then(board => {
        this.board = board;
        this.lists = board.lists.filter(list => !list.closed);
        return board;
      });
  }

  getLists(): Promise<ListModel[]> {
    if (this.lists) {
      return Promise.resolve(this.lists);
    }
    const endpoint = `https://api.trello.com/1/boards/${boardId}/lists`;
    const url = this.getURL(endpoint);
    return axios.get(url.href)
      .then(res => {
        return res.data as ListModel[];
      });
  }

  getCards(): Promise<CardModel[]> {
    const endpoint = `https://api.trello.com/1/boards/${boardId}/cards`;
    const url = this.getURL(endpoint);
    url.searchParams.set('members', 'true');
    url.searchParams.set('member_fields', 'username,fullName');
    url.searchParams.set('pluginData', 'true');
    url.searchParams.set('checklists', 'all');
    return axios.get(url.href)
      .then(res => {
        return res.data as CardModel[];
      })
      .then(cards => {
        return this.getBoard().then(() => cards);
      })
      .then(cards => {
        return cards.map(card => {
          return {
            ...card,
            pluginData: card.pluginData.map(data => {
              try {
                const value = JSON.parse(data.value);
                return { ...data, value };
              } catch (err) {
                return data;
              }
            })
          };
        });
      })
      .then(cards => {
        return cards.map(card => this.complementCardInfo(card));
      })
      .then(cards => {
        return cards.map(card => this.validateCanReleaseCard(card));
      });
  }

  private complementCardInfo(card: CardModel): CardModel {
    const _listName = this.lists!.find(list => list.id === card.idList)!.name;
    const _assignMembers = !!card.idMembers.length;
    const _hasLabels = !!card.idLabels.length;
    const _daysFromLastActivity = moment().diff(moment(card.dateLastActivity), 'days', true);
    const _allCheckItemsComplete = card.checklists.every(checklist => checklist.checkItems.every(item => item.state === 'complete'));
    const pluginData = new PluginData(card, this.board!.pluginData);
    const _storyPoint = pluginData.getStoryPoint();
    const _leadtime = pluginData.getLeadtimeDiffAsDays();
    return {
      ...card,
      _listName,
      _assignMembers,
      _hasLabels,
      _daysFromLastActivity,
      _allCheckItemsComplete,
      _storyPoint: pluginData.getStoryPoint(),
      _leadtime: pluginData.getLeadtimeDiffAsDays(),
    };
  }

  private validateCanReleaseCard(card: CardModel): CardModel {
    const isInReleaseList = /(RELEASE|DONE)/i.test(card._listName);
    const hasFromEpicLabel = !!card.labels.find(label => label.name === FROM_EPIC_LABEL);
    const isValidDescriptionEpic = !hasFromEpicLabel || (hasFromEpicLabel && /EPIC [0-9]+/.test(card.desc));
    const hasFromIssueLabel = !!card.labels.find(label => label.name === FROM_ISSUE_LABEL);
    const isValidDescriptionIssue = !hasFromIssueLabel || (hasFromIssueLabel && /github\.com\/.+\/issues\/[0-9]+/.test(card.desc));
    const isValidDescriptionPR = /github\.com\/.+\/pull\/[0-9]+/.test(card.desc);
    const releaseStatus: string[] = [];
    if (isInReleaseList) {
      if (!card._assignMembers) {
        releaseStatus.push('Set Members');
      }
      if (!card._hasLabels) {
        releaseStatus.push('Set Labels');
      }
      if (!card._allCheckItemsComplete) {
        releaseStatus.push('Complete CheckItems');
      }
      if (card._storyPoint == null) {
        releaseStatus.push('Set SP');
      }
      if (card._leadtime == null) {
        releaseStatus.push('Set LT_FROM and LT_TO');
      }
      if (!isValidDescriptionEpic) {
        releaseStatus.push('Write EPIC No. in description');
      }
      if (!isValidDescriptionIssue) {
        releaseStatus.push('Write GitHub issue link in description');
      }
      if (!isValidDescriptionPR) {
        releaseStatus.push('Write GitHub PR link in description');
      }
    }
    return {
      ...card,
      _releaseStatus: isInReleaseList
        ? releaseStatus.length > 0
          ? 'NG: ' + releaseStatus.join(', ')
          : 'OK'
        : 'Not in RELEASE list',
    };
  }

  // private getCardActions(cardId: string): Promise<any[]> {
  //   const endpoint = `https://api.trello.com/1/cards/${cardId}/actions`;
  //   const url = this.getURL(endpoint);
  //   return axios.get(url.href)
  //     .then(res => {
  //       return res.data as PluginDataModel[];
  //     });
  // }

  postCardComment(cardId: string, text: string): Promise<any[]> {
    const endpoint = `https://api.trello.com/1/cards/${cardId}/actions/comments`;
    const url = this.getURL(endpoint);
    return axios.post(url.href, { text: '@ovrmrw ' + text })
      .then(res => {
        return res.data as any[];
      });
  }

  // getLabels(): Promise<LabelModel[]> {
  //   const endpoint = `https://api.trello.com/1/boards/${boardId}/labels`;
  //   const url = this.getURL(endpoint);
  //   return axios.get(url.href)
  //     .then(res => {
  //       return res.data as LabelModel[];
  //     });
  // }

  // getMembers(): Promise<MemberModel[]> {
  //   const endpoint = `https://api.trello.com/1/boards/${boardId}/members`;
  //   const url = this.getURL(endpoint);
  //   return axios.get(url.href)
  //     .then(res => {
  //       return res.data as MemberModel[];
  //     });
  // }

  // getChecklists(): Promise<CheckListModel[]> {
  //   const endpoint = `https://api.trello.com/1/boards/${boardId}/checklists`;
  //   const url = this.getURL(endpoint);
  //   return axios.get(url.href)
  //     .then(res => {
  //       // console.log(res.data);
  //       return res.data as CheckListModel[];
  //     });
  // }

  // getPlugins(): Promise<any[]> {
  //   const endpoint = `https://api.trello.com/1/boards/${boardId}/plugins`;
  //   const url = this.getURL(endpoint);
  //   return axios.get(url.href)
  //     .then(res => {
  //       return res.data as any[];
  //     });
  // }
}
