const fs = require('fs');
const path = require('path');
const https = require('https');

const voiceDir = path.join(__dirname, '..', 'static', 'sounds', 'voice');
if (!fs.existsSync(voiceDir)) {
    fs.mkdirSync(voiceDir, { recursive: true });
}

const voices = [
    { name: '002_intro', text: 'おおきいほうを、タップしてね', speaker: 3 },
    { name: '003_intro', text: 'おなじかたちを、さがそう', speaker: 3 },
    { name: '004_intro', text: 'えをみて、なまえをあててね', speaker: 3 },
    { name: '005_intro', text: 'すうじを、ゆびでなぞってみよう', speaker: 3 },
    { name: '006_intro', text: 'ばいきんを、あわあわでやっつけよう', speaker: 3 },
    { name: '007_intro', text: 'はんたいのいみを、さがしてね', speaker: 3 },
    { name: '008_intro', text: 'おてんきにあう、おようふくはどれかな', speaker: 3 },
    { name: '009_intro', text: 'いろをまぜると、どうなるかな', speaker: 3 },
    { name: '010_intro', text: 'すきなおとをならして、あそぼう', speaker: 3 },
    { name: 'clear', text: 'よくできました', speaker: 3 },
    { name: 'select_sticker', text: 'すきなシールをひとつ、えらんでね', speaker: 3 }
];

const sleep = ms => new Promise(r => setTimeout(r, ms));

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

async function downloadVoiceWithRetry(voice) {
    const url = `https://api.tts.quest/v3/voicevox/synthesis?text=${encodeURIComponent(voice.text)}&speaker=${voice.speaker}`;
    const filePath = path.join(voiceDir, `${voice.name}.mp3`);
    
    let retries = 5;
    while (retries > 0) {
        console.log(`Requesting: ${voice.name}...`);
        const data = await fetchUrl(url);
        try {
            const json = JSON.parse(data);
            if (json.success && json.mp3DownloadUrl) {
                console.log(`Downloading MP3: ${json.mp3DownloadUrl}`);
                await downloadMp3(json.mp3DownloadUrl, filePath);
                console.log(`Saved: ${filePath}`);
                await sleep(5000); // 成功後も長めに待機
                return;
            } else if (json.errorMessage === 429) {
                const waitTime = (json.retryAfter || 5) * 1000;
                console.log(`Rate limited. Waiting ${waitTime}ms...`);
                await sleep(waitTime + 1000);
            } else {
                console.error(`API Error for ${voice.name}:`, json);
                await sleep(5000);
            }
        } catch (e) {
            console.error(`Parse Error:`, e, data);
            await sleep(5000);
        }
        retries--;
    }
    console.error(`Failed to download ${voice.name} after retries.`);
}

async function run() {
    for (const voice of voices) {
        await downloadVoiceWithRetry(voice);
    }
    console.log('Finished.');
}

run();
