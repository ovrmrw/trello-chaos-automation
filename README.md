# trello-chaos-automation

---

## Prepare

1. プロジェクトのルートディレクトリに`trello-secret.json`を作る。  
その中に下記のようにTrelloの設定を書く。

```json
{
  "apiKey": "<your apiKey>",
  "token": "<your token>",
  "boardId": "<your Board ID>"
}
```

2. プロジェクトのルートディレクトリに`slack-secret.json`を作る。
その中に下記のようにSlackの設定を書く。

```json
{
  "webhookUrl": "https://hooks.slack.com/services/<your setting>"
}
```

## Setup
```
$ npm install
```

## Run
```
$ npm start
```

`json`ディレクトリに色々なJSONファイルを出力する。
