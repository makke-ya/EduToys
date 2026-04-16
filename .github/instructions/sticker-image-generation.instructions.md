---
applyTo: "static/stickers/**,scripts/generate_sticker_images.mjs"
---

# シール画像生成の共通手順

- シール画像を更新するときは、必ず `npm run generate:stickers` を使ってください。
- プロンプトの入力元は `static/stickers/pixel_sticker_prompts.md`、保存先は `static/stickers/stickers.json` に定義された既存 PNG パスです。
- `static/stickers/nanobanana-output/` のような中間出力フォルダを新設せず、既存ファイルを直接更新してください。
- モデルは `gemini-3-pro-image-preview` を優先し、失敗時のみ `gemini-3.1-flash-image-preview` を使ってください。
- API が JPEG を返しても、最終保存は PNG に統一してください。
- API が透過なし画像を返した場合も、そのまま保存せず、四隅の背景色から透過化した PNG に正規化してください。
- `stickers.json` のパス・ID・カテゴリは既存定義を変更せず、そのまま使ってください。
