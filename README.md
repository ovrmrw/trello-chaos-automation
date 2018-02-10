# trello-chaos-automation

---

## Prepare

プロジェクトのルートディレクトリに`trello-secret.json`を作る。  
その中に下記のようにTrelloの設定を書く。

```json
{
  "apiKey": "<your apiKey>",
  "token": "<your token>",
  "boardId": "<your Board ID>"
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
