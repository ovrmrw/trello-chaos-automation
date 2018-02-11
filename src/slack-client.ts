import axios from 'axios';
import { slack } from './config';

export class SlackClient {
  private readonly webhookUrl: string = slack.webhookUrl;
  private readonly whoToMention: string[] = slack.whoToMention;

  constructor(private disabled: boolean = false) { }

  postMessage(message: string | any, title?: string): Promise<void> {
    const _title = title ? `*【${title}】*\n` : '';
    const body = typeof message === 'string'
      ? { text: _title + message }
      : { text: _title + `\`\`\`\n${JSON.stringify(message, null, 4)}\n\`\`\`` };
    return !this.disabled
      ? axios.post(this.webhookUrl, { ...body, mrkdwn: true })
        .then(res => {
          console.log('SlackClient#postMessage:', res.data);
        })
      : Promise.resolve();
  }

  postMessageWithMention(message: string | any, title?: string): Promise<void> {
    const mention = this.whoToMention.map(who => `<${who}>`).join(' ');
    const _message = typeof message === 'string'
      ? message + '\n' + mention
      : `\`\`\`\n${JSON.stringify(message, null, 4)}\n\`\`\`` + '\n' + mention;
    return this.postMessage(_message, title);
  }
}
