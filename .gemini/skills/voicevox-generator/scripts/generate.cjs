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
    const baseUrl = `https://api.tts.quest/v3/voicevox/synthesis?text=${encodeURIComponent(text)}&speaker=${speaker}`;
    
    // 1. まず最初のリクエストを投げて生成を開始させる
    console.log(`Starting synthesis for: "${text}"...`);
    await fetchUrl(baseUrl);
    
    // 2. 生成には時間がかかるので、15秒待機する
    console.log(`Waiting 15 seconds for server to generate...`);
    await sleep(15000);

    // 3. ダウンロードURLを取得するまでリトライ
    let retries = 5;
    while (retries > 0) {
        process.stdout.write(`Checking status... `);
        const data = await fetchUrl(baseUrl);
        try {
            const json = JSON.parse(data);
            if (json.success && json.isAudioReady) {
                console.log(`Ready! Downloading...`);
                await downloadMp3(json.mp3DownloadUrl, filePath);
                console.log(`✅ Saved to: ${filePath}`);
                await sleep(5000); // 次のリクエストまで間隔を空ける
                return true;
            } else {
                console.log(`Not ready. Waiting 10 more seconds...`);
                await sleep(10000);
            }
        } catch (e) {
            console.error(`\n❌ Parse Error:`, e, data);
            await sleep(5000);
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
    if (!success) {
        console.error("Failed finally.");
        process.exit(1);
    }
});
