# シール帳（Sticker Book）実装プラン

## 概要

ゲームクリア時にごほうびシールを1枚選んで貼れる「シール帳」機能を実装する。
GEMINI.mdのガイドラインに従い、クリアオーバーレイの構造は
**シール選択 → 「シールちょう」/「もういっかい！」ボタン** の共通パターンとする。

## アプローチ

- **データ永続化**: localStorage で収集済みシールと貼付位置を保存
- **シールアセット**: テーマ別SVGシール（どうぶつ・たべもの・のりもの等）を作成
- **クリアフロー改修**: ゲームクリア → はなまる → シール選択 → ボタン表示
- **シール帳ビュー**: 台紙ページにシールを自由配置、ページ切り替え可能

## 進捗

- `js/storage.js` と `js/sticker-book.js` を追加して、シール保存・台紙配置・カタログ読込を実装済み
- `index.html` と `games/001_count_tap/` を更新して、クリア後のシール選択とシール帳画面を実装済み
- シール16種、台紙背景、関連テストを追加済み

## ファイル構成

```
static/stickers/            # シールSVGアセット
  animals/                  # どうぶつ (うさぎ, ねこ, いぬ, etc.)
  food/                     # たべもの (りんご, ケーキ, etc.)
  vehicles/                 # のりもの (くるま, でんしゃ, etc.)
  nature/                   # しぜん  (はな, ほし, にじ, etc.)
js/storage.js               # localStorage ラッパー
js/sticker-book.js          # シール帳UIロジック（Vue連携）
static/common/css/sticker.css  # シール帳固有スタイル
static/images/sticker_page_bg.svg  # シール台紙背景
```

## TODO一覧

### Phase 1: データ層 & ストレージ

#### 1-1. js/storage.js — localStorage ラッパー作成
- `EduToys.storage` 名前空間に以下メソッドを実装:
  - `load()` — localStorage から JSON を読み込んでパース
  - `save()` — 現在の状態を JSON で書き込み
  - `addSticker(stickerId, pageIndex, x, y)` — シールを追加
  - `getStickers()` — 全シール一覧を返す
  - `getAvailableStickers()` — 未貼付の獲得済みシール一覧
  - `awardSticker(stickerId)` — ゲームクリアでシール獲得
  - `clearAll()` — データリセット（デバッグ用）
- データ構造:
  ```json
  {
    "version": 1,
    "earnedStickers": ["animals_rabbit", "food_apple", ...],
    "pages": [
      {
        "stickers": [
          { "id": "animals_rabbit", "x": 120, "y": 200, "rotation": 5 }
        ]
      }
    ]
  }
  ```
- テスト: Jest で storage.js の単体テスト作成

### Phase 2: シールアセット

#### 2-1. SVGシール画像を作成（最低16種）
- どうぶつ (4種): うさぎ、ねこ、いぬ、ぞう
- たべもの (4種): りんご、ケーキ、アイス、おにぎり
- のりもの (4種): くるま、でんしゃ、ひこうき、ふね
- しぜん  (4種): はな、ほし、にじ、おひさま
- 各シール: 120×120px SVG、パステルカラー、太い輪郭線
- 配置先: `static/stickers/{category}/{name}.svg`

#### 2-2. シール定義ファイル（static/stickers/stickers.json）
- 全シールのメタデータ（id, name, category, path）
- ゲームごとにどのカテゴリから選択肢を出すかのマッピング

### Phase 3: クリアオーバーレイ改修

#### 3-1. 共通クリアオーバーレイ構造を設計
- GEMINI.md準拠: シール選択 → ボタン の2ステップ
- フロー:
  1. 「クリア！」テキスト & はなまるアニメーション
  2. 「ごほうびシールをえらんでね！」テキスト表示
  3. シール候補3枚を表示（ゲーム関連カテゴリからランダム）
  4. タップでシール獲得 → キラキラエフェクト & 効果音
  5. 「シールちょう」/「もういっかい！」ボタン表示

#### 3-2. 001_count_tap のクリアオーバーレイを更新
- `start.html` のクリアオーバーレイDOMにシール選択UIを追加
- `game.js` の `showClear()` をシール選択フロー対応に改修
- 効果音: シール獲得時に `完了3.mp3` を再生

### Phase 4: シール帳ビュー

#### 4-1. シール台紙の背景SVGを作成
- A4横サイズ比率の台紙デザイン
- 温かみのあるクラフト紙風 + 角丸 + ドット罫線

#### 4-2. index.html のシール帳ビューを実装
- 現在のプレースホルダーを本実装に差し替え
- 構成:
  - ヘッダー: 「シールちょう」タイトル + ページ番号
  - 台紙エリア: SVG背景 + 貼付済みシールを絶対配置で表示
  - 下部: ページ切り替えボタン (◀ ▶) + 未貼付シール一覧
  - 未貼付シールをドラッグ（タッチ長押し）で台紙に貼付
- アニメーション: シール貼付時に「ぺたっ」とスケールバウンド

#### 4-3. js/sticker-book.js — シール帳のインタラクションロジック
- Vue コンポーネント連携でページ切り替え
- タッチ/マウスでシールをドラッグ＆ドロップ
- 貼付時に localStorage に座標保存

### Phase 5: 統合 & 音声

#### 5-1. main.js にストレージ・シール帳を統合
- `EduToys.storage` を初期化
- Vue data に `earnedStickers`, `currentPage` を追加
- `showStickerBook()` でシール帳データをロード

#### 5-2. 音声の追加
- シール選択時: `static/sounds/staging/短い音-ポヨン.mp3`（既存）
- シール貼付時: `static/sounds/system/完了3.mp3`
- ページめくり: `static/sounds/system/ページめくり1.mp3`
- 必要に応じて `git add -f` で追跡追加

#### 5-3. テスト
- storage.js 単体テスト
- シール獲得→保存→復元の統合テスト
- ゲームクリア→シール選択フローの動作確認（ブラウザ）

## 技術的な注意事項

- SPA内なのでパスは `static/stickers/...` 形式（ルート相対）
- ドラッグ&ドロップは `touchstart/touchmove/touchend` 対応必須（タブレットメイン）
- シール台紙の座標は % で保存し、画面サイズ非依存にする
- 幼児向けの読みやすさは保ちつつ、**シール** や **クリア** のようにカタカナが自然な語はカタカナ表記を使う
- ゲームごとに出現シールカテゴリを変えることで収集意欲を高める
