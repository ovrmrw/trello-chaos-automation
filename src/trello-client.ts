import axios from 'axios';
import * as moment from 'moment';
import { URL } from 'url';
import { ListModel, CardModel, LabelModel, PluginDataModel, MemberModel, CheckListModel } from './types';
import { PluginData } from './plugindata';
import { key, token, boardId } from './trello-config';

export class TrelloClient {
  private lists: ListModel[] = [];

  private getURL(endpoint: string): URL {
    const url = new URL(endpoint);
    url.searchParams.set('key', key);
    url.searchParams.set('token', token);
    return url;
  }

  getLists(): Promise<ListModel[]> {
    if (this.lists.length > 0) {
      return Promise.resolve(this.lists);
    }
    const endpoint = `https://api.trello.com/1/boards/${boardId}/lists`;
    const url = this.getURL(endpoint);
    return axios.get(url.href)
      .then(res => {
        return res.data as ListModel[];
      })
      .then(lists => {
        this.lists = lists;
        return lists;
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
        return this.getLists().then(() => cards);
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
      });
  }

  private complementCardInfo(card: CardModel): CardModel {
    const _listName = this.lists.find(list => list.id === card.idList)!.name;
    const inReleaseList = _listName.includes('RELEASE');
    const _assignMembers = !!card.idMembers.length;
    const _hasLabels = !!card.idLabels.length;
    const _daysFromLastActivity = moment().diff(moment(card.dateLastActivity), 'days', true);
    const pluginData = new PluginData(card);
    const _storyPoint = pluginData.getStoryPoint();
    const _leadtime = pluginData.getLeadtimeDiffAsDays();
    const releaseStatus: string[] = [];
    if (inReleaseList) {
      if (!_assignMembers) {
        releaseStatus.push('Set Members');
      }
      if (!_hasLabels) {
        releaseStatus.push('Set Labels');
      }
      if (_storyPoint == null) {
        releaseStatus.push('Set SP');
      }
      if (_leadtime == null) {
        releaseStatus.push('Set LT_FROM and LT_TO');
      }
    }
    return {
      ...card,
      _listName,
      _assignMembers,
      _hasLabels,
      _daysFromLastActivity,
      _storyPoint: pluginData.getStoryPoint(),
      _leadtime: pluginData.getLeadtimeDiffAsDays(),
      _releaseStatus: inReleaseList
        ? releaseStatus.length > 0
          ? 'NG: ' + releaseStatus.join(', ')
          : 'OK'
        : 'Not in RELEASE list',
    };
  }

  private getCardActions(cardId: string): Promise<any[]> {
    const endpoint = `https://api.trello.com/1/cards/${cardId}/actions`;
    const url = this.getURL(endpoint);
    return axios.get(url.href)
      .then(res => {
        return res.data as PluginDataModel[];
      });
  }

  postCardComment(cardId: string, text: string): Promise<any[]> {
    const endpoint = `https://api.trello.com/1/cards/${cardId}/actions/comments`;
    const url = this.getURL(endpoint);
    return axios.post(url.href, { text: '@ovrmrw ' + text })
      .then(res => {
        return res.data as any[];
      });
  }

  getLabels(): Promise<LabelModel[]> {
    const endpoint = `https://api.trello.com/1/boards/${boardId}/labels`;
    const url = this.getURL(endpoint);
    return axios.get(url.href)
      .then(res => {
        return res.data as LabelModel[];
      });
  }

  getMembers(): Promise<MemberModel[]> {
    const endpoint = `https://api.trello.com/1/boards/${boardId}/members`;
    const url = this.getURL(endpoint);
    return axios.get(url.href)
      .then(res => {
        return res.data as MemberModel[];
      });
  }

  getChecklists(): Promise<CheckListModel[]> {
    const endpoint = `https://api.trello.com/1/boards/${boardId}/checklists`;
    const url = this.getURL(endpoint);
    return axios.get(url.href)
      .then(res => {
        // console.log(res.data);
        return res.data as CheckListModel[];
      });
  }

  getPlugins(): Promise<any[]> {
    const endpoint = `https://api.trello.com/1/boards/${boardId}/plugins`;
    const url = this.getURL(endpoint);
    return axios.get(url.href)
      .then(res => {
        return res.data as any[];
      });
  }
}
