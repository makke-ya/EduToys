# index.html.md (作成プラン)

## 1. 概要
`index.html` は、EduToysプロジェクト全体を管理するSPA（シングルページアプリケーション）のメインエントリーポイントです。
各ゲームへのアクセスを提供する「ホーム画面（メニュー）」、「シールちょう」画面、そして各ゲームを動的に読み込む「コンテナ」としての役割を担います。
商用クオリティの演出を実現するため、UIレイヤー（DOM）とゲームレイヤー（Canvas）を分離したアーキテクチャの基盤となります。

## 2. アーキテクチャと外部ライブラリ
*   **UIレイヤー (DOM)**:
    *   **TailwindCSS (CDN)**: スタイリングとレスポンシブ対応。
    *   **Vue.js (CDN, Global Build)**: メニュー画面の状態管理、ビューの切り替え、リアクティブなUI構築。
*   **ゲーム・演出レイヤー (Canvas / JS)**:
    *   **PixiJS (CDN)**: 60FPSでの高速な2Dレンダリング、メインのゲーム画面描画。
    *   **GSAP (CDN)**: 弾性のあるバウンドや複雑なタイムラインアニメーション。
    *   **Howler.js (CDN)**: BGMや複数の効果音（SE/ボイス）の遅延のない再生・管理。

## 3. 画面構成（Vueコンポーネントまたは状態ベースの切り替え）

### 3.1 全体レイアウト
*   **ヘッダー領域**:
    *   アプリのタイトルロゴ（「すくすく ぷれー」等）。
    *   右上に「シールちょう」へ遷移するための3D風ボタン。
*   **メイン領域（`<div id="app">` またはメインコンテナ）**:
    *   Vue.jsまたはVanilla JSのロジックにより、以下の3つのビューを切り替えます。

### 3.2 ホームビュー（ゲーム選択画面）
*   **カテゴリ別セクション**:
    *   「もじ」「かず」「ちえ」などのカテゴリごとにセクションを分割。
    *   横スクロール（カルーセル）またはグリッド配置で、ゲームのサムネイルカードを並べる。
    *   カードにはひらがなでゲーム名を記載し、タップ時に `EduToys.loadGame('000_game_name')` をトリガーする。

### 3.3 シールちょうビュー
*   獲得したシールを一覧表示する画面。
*   ホーム画面へ戻る「◀ もどる」ボタンを左上に配置。

### 3.4 ゲームプレイビュー（動的コンテナ）
*   ゲームが選択されると表示されるコンテナ領域。
*   画面左上には常に「◀ もどる」ボタンを配置（Vue/DOMレイヤーで管理）。
*   内部には、ゲーム固有のUIを読み込むためのDOM領域と、PixiJSがCanvasを展開するためのターゲット領域（`<div id="game-canvas-container">` 等）を用意する。

## 4. デザイン・スタイル方針
*   **ベースカラー**: パステルトーン（クリーム系の背景 `#fdfaf0`）。微細な背景パターンを追加。
*   **フォント**: `'Hiragino Maru Gothic ProN', 'Rounded M+ 1c', 'Meiryo', sans-serif`（すべてひらがな）。
*   **共通CSS**: `<link rel="stylesheet" href="static/common/css/game_style.css">` を読み込み、Tailwindで表現が難しいアニメーションやボタンの立体感を定義。
*   **レスポンシブ**: 最小320px〜最大1024pxで最適に表示されるよう、Flexboxでコンテナサイズを制限（`max-w-2xl` など）。

## 5. `js/main.js` との連携要件
*   `index.html` の末尾で `<script src="js/main.js"></script>` を読み込む。
*   `js/main.js` 内でVueアプリケーションをマウントし、状態（現在のビュー、選択中のゲームなど）を管理する。
*   `EduToys` グローバルオブジェクト（またはVueのメソッド）として、ゲームの読み込み（Fetch）、開始、そして **クリーンアップ（PixiJSの破棄、Howlerの停止等）** の処理をフックできるようにする。

## 6. HTML構造イメージ
```html
<!DOCTYPE html>
<html lang="ja">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
    <title>EduToys</title>
    <!-- TailwindCSS, Vue.js, PixiJS, GSAP, Howler.js のCDN読み込み -->
    <!-- 共通CSSの読み込み -->
</head>
<body class="bg-[#fdfaf0] text-[#5a4b41] font-sans overflow-hidden">
    <div id="app" class="h-screen w-full flex flex-col items-center justify-center">
        <!-- Vue.js によってビューが動的に切り替わる領域 -->
        
        <!-- 例: ゲームコンテナ -->
        <!-- <div id="game-container" class="w-full max-w-2xl flex-1 flex flex-col relative hidden"> -->
            <!-- DOMレイヤーのヘッダー（もどるボタン等） -->
            <!-- Canvasが展開されるコンテナ -->
            <!-- <div id="canvas-container" class="flex-1 w-full bg-white rounded-3xl overflow-hidden border-8 border-orange-400"></div> -->
            <!-- DOMレイヤーのオーバーレイ（クリア画面等） -->
        <!-- </div> -->
    </div>
    <script src="js/main.js"></script>
</body>
</html>
```