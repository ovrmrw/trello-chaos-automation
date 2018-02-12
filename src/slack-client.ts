import axios from 'axios';
import { slackConfig } from './config';

const { webhookUrl, whoToMention } = slackConfig;

export class SlackClient {
  constructor(private disabled: boolean = false) { }

  postMessage(message: string | any, title?: string): Promise<void> {
    const _title = title ? `*【${title}】*\n` : '';
    const body = typeof message === 'string'
      ? { text: _title + message }
      : { text: _title + this.wrapAsCodeBlock(message) };
    return !this.disabled
      ? axios.post(webhookUrl, { ...body, mrkdwn: true })
        .then(res => {
          console.log('SlackClient#postMessage:', res.data);
        })
      : Promise.resolve();
  }

  postMessageWithMention(message: string | any, title?: string): Promise<void> {
    // const mention = whoToMention.map(who => `<${who}>`).join(' '); // Do this if you want to really send a mention.
    const mention = whoToMention.map(who => `at ${who.replace(/^@/, '')}`).join(', ');
    const _message = typeof message === 'string'
      ? mention + '\n' + message
      : mention + '\n' + this.wrapAsCodeBlock(message);
    return this.postMessage(_message, title);
  }

  private wrapAsCodeBlock(text: string): string {
    const _text: string = typeof text === 'string'
      ? text
      : JSON.stringify(text, null, 4);
    return '```\n' + `${_text}\n` + '```\n';
  }
}
