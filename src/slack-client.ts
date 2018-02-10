import axios from 'axios';
import { slack } from './config';

export class SlackClient {
  private readonly webhookUrl: string = slack.webhookUrl;

  postMessage(message: string | any, title?: string): Promise<void> {
    const _title = title ? `**【${title}】**\n` : '';
    const body = typeof message === 'string'
      ? { text: _title + message }
      : { text: _title + JSON.stringify(message, null, 4) };
    return axios.post(this.webhookUrl, body)
      .then(res => {
        console.log('SlackClient#postMessage:', res.data);
      });
  }
}