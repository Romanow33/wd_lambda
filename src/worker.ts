import { parentPort } from 'worker_threads';
import { Jimp } from 'jimp';
import { createHash } from 'crypto';

const laplacianKernel = [0, 1, 0, 1, -4, 1, 0, 1, 0];
const SAMPLE_SIZE = 20;

async function analyze(buffer: Buffer): Promise<{ brightness: number; sharpness: number }> {
    const image = await Jimp.read(buffer);
    image.resize({ w: SAMPLE_SIZE, h: SAMPLE_SIZE }).greyscale();
    const { width, height, data } = image.bitmap;

    let sumGray = 0;
    let lapSum = 0, lapSumSq = 0, count = 0;

    const getGray = (x: number, y: number): number => {
        if (x < 0 || y < 0 || x >= width || y >= height) return 0;
        const idx = (y * width + x) << 2;
        return data[idx];
    };

    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            const g = getGray(x, y);
            sumGray += g;

            if (x > 0 && y > 0 && x < width - 1 && y < height - 1) {
                let conv = 0;
                for (let ky = -1; ky <= 1; ky++) {
                    for (let kx = -1; kx <= 1; kx++) {
                        const k = laplacianKernel[(ky + 1) * 3 + (kx + 1)];
                        conv += getGray(x + kx, y + ky) * k;
                    }
                }
                lapSum += conv;
                lapSumSq += conv * conv;
                count++;
            }
        }
    }

    const brightness = sumGray / (width * height);
    const meanLap = lapSum / count;
    const variance = lapSumSq / count - meanLap * meanLap;

    return { brightness, sharpness: variance };
}

async function hashBuffer(buffer: Buffer): Promise<string> {
    return createHash('sha1').update(buffer).digest('hex').slice(0, 16);
}

parentPort!.on('message', async (msg: any) => {
    const { taskId, type, buffer } = msg;
    try {
        if (type === 'analyze') {
            const res = await analyze(buffer);
            parentPort!.postMessage({ taskId, ...res });
        } else if (type === 'hash') {
            const hash = await hashBuffer(buffer);
            parentPort!.postMessage({ taskId, hash });
        }
    } catch (err: any) {
        parentPort!.postMessage({ taskId, error: err.message });
    }
});
