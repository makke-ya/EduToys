const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

async function generateVoice(text, speaker, filePath) {
    console.log(`Generating voice for: "${text}"...`);
    
    const scriptPath = '/workspace/VOICEVOX/vv-speak.sh';
    const tempWav = path.join(path.dirname(filePath), `temp_${Date.now()}.wav`);
    
    // 1. Generate WAV using the local shell script
    const result = spawnSync('bash', [scriptPath, text, speaker, tempWav], {
        encoding: 'utf-8',
        stdio: 'inherit'
    });

    if (result.status !== 0) {
        console.error(`\n❌ Error: VOICEVOX synthesis failed.`);
        if (fs.existsSync(tempWav)) fs.unlinkSync(tempWav);
        return false;
    }

    // 2. Convert WAV to MP3 using ffmpeg
    console.log(`Converting to MP3...`);
    const ffmpegResult = spawnSync('ffmpeg', [
        '-i', tempWav,
        '-y',
        '-acodec', 'libmp3lame',
        '-ab', '128k',
        filePath
    ], { encoding: 'utf-8' });

    // Cleanup temp WAV
    if (fs.existsSync(tempWav)) fs.unlinkSync(tempWav);

    if (ffmpegResult.status === 0) {
        console.log(`✅ Success: Saved to ${filePath}`);
        return true;
    } else {
        console.error(`\n❌ Error: ffmpeg conversion failed.`, ffmpegResult.stderr);
        return false;
    }
}

const args = process.argv.slice(2);
if (args.length < 3) {
    console.log('Usage: node generate.cjs <text> <speaker_id> <output_path>');
    process.exit(1);
}

const [text, speaker, outputPath] = args;
const absoluteOutputPath = path.resolve(outputPath);
const dir = path.dirname(absoluteOutputPath);

if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
}

generateVoice(text, speaker, absoluteOutputPath).then(success => {
    if (!success) process.exit(1);
});
