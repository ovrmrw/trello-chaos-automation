import * as moment from 'moment';
import { CardModel, PluginDataModel } from './types';

export class PluginData {
  private readonly customFieldsPluginId = '56d5e249a98895a9797bebb9';
  private readonly storyPointKey = 'IQGag7Pd-kIUKA2';
  private readonly leadtimeFromKey = 'IQGag7Pd-fO2lGu';
  private readonly leadtimeToKey = 'IQGag7Pd-bPg34Q';
  private pluginData: PluginDataModel[];

  constructor(card: CardModel) {
    this.pluginData = card.pluginData;
  }

  getStoryPoint(): number | null {
    const customFields = this.pluginData
      .find(data => data.idPlugin === this.customFieldsPluginId);
    if (customFields) {
      if (customFields.value['fields'] && customFields.value['fields'][this.storyPointKey]) {
        return Number(customFields.value['fields'][this.storyPointKey]);
      }
    }
    return null;
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
    const customFields = this.pluginData
      .find(data => data.idPlugin === this.customFieldsPluginId);
    if (customFields) {
      if (customFields.value['fields'] && customFields.value['fields'][this.leadtimeFromKey]) {
        return customFields.value['fields'][this.leadtimeFromKey];
      }
    }
    return null;
  }

  private getLeadtimeTo(): string | null {
    const customFields = this.pluginData
      .find(data => data.idPlugin === this.customFieldsPluginId);
    if (customFields) {
      if (customFields.value['fields'] && customFields.value['fields'][this.leadtimeToKey]) {
        return customFields.value['fields'][this.leadtimeToKey];
      }
    }
    return null;
  }
}
