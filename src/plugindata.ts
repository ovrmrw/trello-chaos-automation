import * as moment from 'moment';
import { CardModel, PluginDataModel, ID } from './types';

interface FieldModel {
  n: ID;
  id: string;
}

export class PluginData {
  private readonly customFieldsPluginId = '56d5e249a98895a9797bebb9';
  private storyPointKey: string;
  private leadtimeFromKey: string;
  private leadtimeToKey: string;
  private pluginData: PluginDataModel[];

  constructor(card: CardModel, boardPluginData: PluginDataModel[]) {
    this.pluginData = card.pluginData;

    boardPluginData.filter(data => data.idPlugin === this.customFieldsPluginId).forEach(data => {
      const fields: FieldModel[] = data.value['fields'] || [];
      if (fields.length > 0) {
        this.storyPointKey = fields.find(field => /^SP/.test(field.n))!.id;
        this.leadtimeFromKey = fields.find(field => /^LT_FROM/.test(field.n))!.id;
        this.leadtimeToKey = fields.find(field => /^LT_TO/.test(field.n))!.id;
      }
    });
  }

  getStoryPoint(): number | null {
    return this.pluginData
      .filter(data => data.idPlugin === this.customFieldsPluginId)
      .map(data => {
        const fields: Record<string, string>[] = data.value['fields'] || {};
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
      .filter(data => data.idPlugin === this.customFieldsPluginId)
      .map(data => {
        const fields: Record<string, string>[] = data.value['fields'] || {};
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
      .filter(data => data.idPlugin === this.customFieldsPluginId)
      .map(data => {
        const fields: Record<string, string>[] = data.value['fields'] || {};
        if (this.leadtimeToKey && fields[this.leadtimeToKey]) {
          return fields[this.leadtimeToKey];
        } else {
          return null;
        }
      })
      .reduce((p, v) => v, null);
  }
}
