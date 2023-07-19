# slack-gpt-bot

slack-gpt-botは、Slackのスレッドに参加し、OpenAIのGPT-3.5-turboモデルを使用してユーザーと対話するAWS Lambda関数です。このプロジェクトは、TerraformとNode.jsを使用してAWS上にデプロイされます。

## 前提条件

- AWSアカウントを持っていること
- AWS CLIがインストールされ、適切なAWSクレデンシャルが設定されていること
- Terraformがインストールされていること

## ファイルの説明

### app.tf

`app.tf`はTerraform設定ファイルで、AWSリソースの作成と設定を行います。

### lambda/index.js

`index.js`はAWS Lambda関数のコードで、Slackからのメッセージを受け取り、OpenAIと対話した結果をSlackに投稿します。

## 使用方法

1. このプロジェクトのルートディレクトリに移動し、`terraform init`を実行してTerraformを初期化します。
2. `terraform apply`を実行してAWSリソースを作成します。このコマンドは、作成されるリソースのプレビューを表示し、続行するかどうかを確認します。`yes`を入力して続行します。

以上で、AWS上にリソースが作成され、Lambda関数がデプロイされます。

なお、ここでは詳細は書きませんが、別途、Slackアプリの追加が必要です。Slackアプリの設定で、Subscribe to bot eventsは`app_mention`を選択してください。また、アプリにはスレッドの読み込み権限と書き込み権限を与えてください。これらの設定は、上記のTerraformの実行後に行ってください。

## 注意事項

このプロジェクトはデモンストレーション用であり、本番環境での使用は推奨されません。また、このプロジェクトはOpenAIのAPIキーとSlackのAPIトークンを環境変数としてLambda関数に渡すことを前提としています。これらの値は秘密情報であり、安全に管理する必要があります。
