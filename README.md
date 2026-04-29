# 断熱・荷重計算ツール

壁体断面の熱貫流率（U値）と固定荷重を計算するWebアプリです。

## 機能

- 最大10レイヤーの断面構成入力
- 断熱部・熱橋部の面積比設定（U値計算用・固定荷重計算用を独立設定）
- 熱貫流率（U値）計算（Excelロジック準拠）
- 固定荷重計算
- データのJSON保存・読み込み
- 断面プレビュー

## ローカル開発

```bash
# 依存パッケージのインストール
npm install

# 開発サーバー起動
npm run dev
```

ブラウザで http://localhost:5173 を開いてください。

## ビルド

```bash
npm run build
```

`dist/` フォルダに成果物が出力されます。

## Vercelへのデプロイ

1. このリポジトリをGitHubにpush
2. [vercel.com](https://vercel.com) でGitHubアカウントでサインイン
3. 「New Project」→ このリポジトリを選択
4. Framework: **Vite** を選択（自動検出される場合がほとんど）
5. 「Deploy」をクリック

以降はmainブランチへのpushで自動デプロイされます。

## 技術スタック

- React 18
- Vite 5
- Canvas API（断面プレビュー）
