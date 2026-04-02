---
name: voicevox-generator
description: Generate voice audio files using a local VOICEVOX engine via a shell script. Use this skill when you need to create narration or character voices for educational games or apps. Supports multiple speakers like Zundamon.
---

# Voicevox Generator

This skill provides a way to generate MP3 audio files from text using a local VOICEVOX engine via a shell script and ffmpeg.

## Usage

Run the provided script using Node.js.

### Node.js Script

```bash
node scripts/generate.cjs "<text>" <speaker_id> <output_path>
```

- `<text>`: The text to be spoken (Japanese recommended).
- `<speaker_id>`: The ID of the VOICEVOX speaker (see below).
- `<output_path>`: The path where the MP3 file will be saved.

### Common Speaker IDs

- `3`: ずんだもん (Zundamon) - Recommended for children's apps.
- `1`: 四国めたん (Shikoku Metan)
- `2`: 四国めたん (あまあま)
- `8`: 春日部つむぎ (Kasukabe Tsumugi)

### Examples

Generate an intro for a game:
```bash
node scripts/generate.cjs "りんごを タップしてね" 3 static/sounds/voice/001_intro.mp3
```

## Considerations

- **Engine Initialization**: The script automatically starts the VOICEVOX engine if it's not already running.
- **Format**: Outputs standard **MP3** files using ffmpeg conversion.
- **Credits**: When using these voices, please include appropriate credits (e.g., "音声合成：VOICEVOX:ずんだもん").
