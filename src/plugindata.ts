import * as moment from 'moment';
import * as assert from 'assert';
import { CardModel, PluginDataModel, ID } from './types';

interface FieldModel {
  n: ID;
  id: string;
}

const CUSTOM_FIELDS_PLUGIN_ID = '56d5e249a98895a9797bebb9';
const FIELDS = 'fields';

export class PluginData {
  private storyPointKey: string;
  private leadtimeFromKey: string;
  private leadtimeToKey: string;
  private pluginData: PluginDataModel[];

  constructor(card: CardModel, boardPluginData: PluginDataModel[]) {
    this.pluginData = card.pluginData || [];

    boardPluginData.filter(data => data.idPlugin === CUSTOM_FIELDS_PLUGIN_ID).forEach(data => {
      const fields: FieldModel[] = data.value[FIELDS] || [];
      if (fields.length > 0) {
        this.storyPointKey = fields.find(field => /^SP/.test(field.n))!.id;
        this.leadtimeFromKey = fields.find(field => /^LT_FROM/.test(field.n))!.id;
        this.leadtimeToKey = fields.find(field => /^LT_TO/.test(field.n))!.id;
      }
    });
    assert(!!this.storyPointKey, 'storyPointKey is not defined.');
    assert(!!this.leadtimeFromKey, 'leadtimeFromKey is not defined.');
    assert(!!this.leadtimeToKey, 'leadtimeToKey is not defined.');
  }

  getStoryPoint(): number | null {
    return this.pluginData
      .filter(data => data.idPlugin === CUSTOM_FIELDS_PLUGIN_ID)
      .map(data => {
        const fields: Record<string, string>[] = data.value[FIELDS] || {};
        if (this.storyPointKey && fields[this.storyPointKey]) {
          return Number(fields[this.storyPointKey]);
        } else {
          return null;
        }
      })
      .reduce((p, v) => v, null);
  }

  getLeadtimeDiffAsDays(): number | null {
    const from = this.getLeadtimeFrom();
    const to = this.getLeadtimeTo();
    if (from && to) {
      return moment(to).diff(moment(from), 'days', true);
    } else {
      return null;
    }
  }

  private getLeadtimeFrom(): string | null {
    return this.pluginData
      .filter(data => data.idPlugin === CUSTOM_FIELDS_PLUGIN_ID)
      .map(data => {
        const fields: Record<string, string>[] = data.value[FIELDS] || {};
        if (this.leadtimeFromKey && fields[this.leadtimeFromKey]) {
          return fields[this.leadtimeFromKey];
        } else {
          return null;
        }
      })
      .reduce((p, v) => v, null);
  }

  private getLeadtimeTo(): string | null {
    return this.pluginData
      .filter(data => data.idPlugin === CUSTOM_FIELDS_PLUGIN_ID)
      .map(data => {
        const fields: Record<string, string>[] = data.value[FIELDS] || {};
        if (this.leadtimeToKey && fields[this.leadtimeToKey]) {
          return fields[this.leadtimeToKey];
        } else {
          return null;
        }
      })
      .reduce((p, v) => v, null);
  }
}
