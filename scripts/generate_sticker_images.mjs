import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, '..');
const promptsPath = path.join(repoRoot, 'static', 'stickers', 'pixel_sticker_prompts.md');
const catalogPath = path.join(repoRoot, 'static', 'stickers', 'stickers.json');
const modelPriority = ['gemini-3-pro-image-preview', 'gemini-3.1-flash-image-preview'];
export const STICKER_OUTPUT_SIZE = 256;
export const CHROMA_KEY_COLOR = '#00FF66';
const STICKER_CONTENT_SIZE = 208;
const SIZE_HINT = `Compose the subject centered with consistent padding so it normalizes cleanly into a ${STICKER_OUTPUT_SIZE}x${STICKER_OUTPUT_SIZE} square sticker canvas.`;
const CHROMA_KEY_HINT = `Do not use a transparent background. Instead, render the entire background as one flat solid chroma key color ${CHROMA_KEY_COLOR} with no gradients, no shadows, and no extra objects in the background. Keep the subject separate from the edges so the chroma key background stays clearly visible around it.`;
const titleAliases = new Map([
    ['ケーキ', 'けーき'],
    ['アイス', 'あいす'],
]);

function parseArgs(argv) {
    return {
        dryRun: argv.includes('--dry-run'),
        repairExisting: argv.includes('--repair-existing'),
    };
}

function parsePrompts(markdown) {
    const matches = [...markdown.matchAll(/^##\s+\d+\.\s+(.+?)\n```text\n([\s\S]*?)\n```/gm)];
    return matches.map(([, title, prompt]) => ({
        title: title.trim(),
        prompt: prompt.trim(),
    }));
}

function normalizeTitle(title) {
    return titleAliases.get(title) ?? title;
}

function getImageSize(imagePath) {
    const dims = execFileSync('identify', ['-format', '%w %h', imagePath], { encoding: 'utf8' }).trim();
    const [width, height] = dims.split(' ').map(Number);
    return { width, height };
}

function normalizeToTransparentPng(sourcePath, targetPath) {
    const { width, height } = getImageSize(sourcePath);
    const workingTargetPath = sourcePath === targetPath
        ? path.join(os.tmpdir(), `edutoys-sticker-normalized-${process.pid}-${Date.now()}.png`)
        : targetPath;

    const normalizedBuffer = execFileSync('convert', [
        sourcePath,
        '-alpha',
        'set',
        '-channel',
        'RGBA',
        '-fuzz',
        '12%',
        '-fill',
        'none',
        '-draw',
        'color 0,0 floodfill',
        '-draw',
        `color 0,${height - 1} floodfill`,
        '-draw',
        `color ${width - 1},0 floodfill`,
        '-draw',
        `color ${width - 1},${height - 1} floodfill`,
        '-trim',
        '+repage',
        '-resize',
        `${STICKER_CONTENT_SIZE}x${STICKER_CONTENT_SIZE}`,
        '-gravity',
        'center',
        '-background',
        'none',
        '-extent',
        `${STICKER_OUTPUT_SIZE}x${STICKER_OUTPUT_SIZE}`,
        'PNG32:-',
    ], { encoding: 'buffer', stdio: ['ignore', 'pipe', 'ignore'] });

    fs.writeFileSync(workingTargetPath, normalizedBuffer);

    if (workingTargetPath !== targetPath) {
        fs.copyFileSync(workingTargetPath, targetPath);
        fs.rmSync(workingTargetPath, { force: true });
    }
}

function buildGenerationPlan() {
    const markdown = fs.readFileSync(promptsPath, 'utf8');
    const catalog = JSON.parse(fs.readFileSync(catalogPath, 'utf8'));
    const stickerByName = new Map(catalog.stickers.map((sticker) => [sticker.name, sticker]));

    return parsePrompts(markdown).map(({ title, prompt }) => {
        const sticker = stickerByName.get(normalizeTitle(title));
        if (!sticker) {
            throw new Error(`stickers.json に対応する定義がありません: ${title}`);
        }

        return {
            title,
            prompt: `${prompt} ${SIZE_HINT} ${CHROMA_KEY_HINT}`,
            sticker,
            targetPath: path.join(repoRoot, sticker.path),
        };
    });
}

async function requestImage(model, prompt) {
    const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
        {
            method: 'POST',
            headers: {
                'x-goog-api-key': process.env.GEMINI_API_KEY,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }],
                generationConfig: { responseModalities: ['TEXT', 'IMAGE'] },
            }),
        },
    );

    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${JSON.stringify(payload)}`);
    }

    const imagePart = payload.candidates?.[0]?.content?.parts?.find((part) => part.inlineData?.data);
    if (!imagePart) {
        throw new Error(`画像データが返ってきませんでした: ${JSON.stringify(payload)}`);
    }

    return imagePart.inlineData;
}

async function generateImage(prompt) {
    let lastError;

    for (const model of modelPriority) {
        for (let attempt = 1; attempt <= 2; attempt += 1) {
            try {
                const inlineData = await requestImage(model, prompt);
                return { model, inlineData };
            } catch (error) {
                lastError = error;
                await new Promise((resolve) => setTimeout(resolve, 1500 * attempt));
            }
        }
    }

    throw lastError;
}

function writePng(targetPath, inlineData) {
    fs.mkdirSync(path.dirname(targetPath), { recursive: true });
    const mimeType = inlineData.mimeType ?? 'image/png';
    const buffer = Buffer.from(inlineData.data, 'base64');
    const tempExt = mimeType.split('/')[1] ?? 'img';
    const tempPath = path.join(os.tmpdir(), `edutoys-sticker-${process.pid}-${Date.now()}.${tempExt}`);
    fs.writeFileSync(tempPath, buffer);
    normalizeToTransparentPng(tempPath, targetPath);
    fs.rmSync(tempPath, { force: true });
}

async function main() {
    const options = parseArgs(process.argv.slice(2));
    const plan = buildGenerationPlan();

    if (options.dryRun) {
        for (const entry of plan) {
            console.log(`PLAN\t${entry.title}\t${entry.sticker.path}`);
        }
        return;
    }

    let failures = 0;

    for (const entry of plan) {
        try {
            if (options.repairExisting) {
                normalizeToTransparentPng(entry.targetPath, entry.targetPath);
                console.log(`OK\t${entry.title}\t${entry.sticker.path}\trepair-existing`);
                continue;
            }

            if (!process.env.GEMINI_API_KEY) {
                throw new Error('GEMINI_API_KEY が設定されていません。');
            }

            const { model, inlineData } = await generateImage(entry.prompt);
            writePng(entry.targetPath, inlineData);
            console.log(`OK\t${entry.title}\t${entry.sticker.path}\t${model}`);
        } catch (error) {
            failures += 1;
            console.log(`FAIL\t${entry.title}\t${entry.sticker.path}\t${error.message}`);
        }
    }

    console.log(`SUMMARY\tupdated=${plan.length - failures}\tfailed=${failures}`);
    if (failures > 0) {
        process.exitCode = 1;
    }
}

if (process.argv[1] && path.resolve(process.argv[1]) === __filename) {
    main().catch((error) => {
        console.error(error.message);
        process.exit(1);
    });
}
