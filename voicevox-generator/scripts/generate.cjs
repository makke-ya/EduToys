const fs = require('fs');
const path = require('path');
const https = require('https');

async function fetchUrl(url) {
    return new Promise((resolve, reject) => {
        https.get(url, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => resolve(data));
        }).on('error', reject);
    });
}

async function downloadMp3(url, filePath) {
    return new Promise((resolve, reject) => {
        const file = fs.createWriteStream(filePath);
        https.get(url, (res) => {
            res.pipe(file);
            file.on('finish', () => {
                file.close();
                resolve();
            });
        }).on('error', (err) => {
            fs.unlink(filePath, () => {});
            reject(err);
        });
    });
}

const sleep = ms => new Promise(r => setTimeout(r, ms));

async function generateVoice(text, speaker, filePath) {
    const url = `https://api.tts.quest/v3/voicevox/synthesis?text=${encodeURIComponent(text)}&speaker=${speaker}`;
    
    let retries = 5;
    while (retries > 0) {
        process.stdout.write(`Requesting synthesis for: "${text}"... `);
        const data = await fetchUrl(url);
        try {
            const json = JSON.parse(data);
            if (json.success && json.mp3DownloadUrl) {
                console.log(`Downloading...`);
                await downloadMp3(json.mp3DownloadUrl, filePath);
                console.log(`✅ Saved to: ${filePath}`);
                return true;
            } else if (json.errorMessage === 429) {
                const waitTime = (json.retryAfter || 5) * 1000;
                console.log(`Rate limited. Waiting ${waitTime}ms...`);
                await sleep(waitTime + 1000);
            } else {
                console.error(`\n❌ API Error:`, json);
                return false;
            }
        } catch (e) {
            console.error(`\n❌ Parse Error:`, e, data);
            return false;
        }
        retries--;
    }
    return false;
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
