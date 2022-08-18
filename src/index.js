import ffmpeg from 'fluent-ffmpeg';
import ffmpegInstaller from '@ffmpeg-installer/ffmpeg';
import ffprobeStatic from 'ffprobe-static';
import fileSize from 'filesize';

const ffmpegPath = ffmpegInstaller.path;
const ffprobePath = ffprobeStatic.path;

/**
 * @class Compressor
 * @description Compresses a video using ffmpeg
 */
export default class Compressor {
    /**
     * @private
     * @description Input file path
     * @type {?string}
     */
    #input = null;

    /**
     * @private
     * @description Output file path
     * @type {?string}
     */
    #output = null;

    /**
     * @private
     * @description The video codec
     * @type {?('h264' | 'h265')}
     */
    #codec = null;

    /**
     * @private
     * @description Video compression mode
     * @type {?('low' | 'medium' | 'high' | 'ultra')}
     */
    #mode = null;

    /**
     *
     * @constructor
     * @param {import("./types/IOptions").default} options
     */
    constructor({ input, output, codec, mode }) {
        this.#input = input;
        this.#output = output;
        this.#codec = codec;
        this.#mode = mode;

        this.#setupFfmpeg();
    }

    /**
     *
     * @private
     * @description Setup the ffmpeg
     */
    #setupFfmpeg() {
        ffmpeg.setFfmpegPath(ffmpegPath);
        ffmpeg.setFfprobePath(ffprobePath);
    }

    /**
     *
     * @private
     * @description Extract metada from a video path
     * @param {string} path
     * @returns {Promise<ffmpeg.FfprobeData>}
     */
    #extractMetadata(path) {
        return new Promise((resolve, reject) => {
            ffmpeg.ffprobe(path, (err, metadata) => {
                if (err) {
                    reject(err);
                }

                resolve(metadata);
            });
        });
    }

    /**
     *
     * @private
     * @description Get the bitrate multiplier
     * @returns {number}
     */
    #getBitrateMultiplier() {
        if (this.#mode === 'low') {
            return 10;
        } else if (this.#mode === 'medium') {
            return 7;
        } else if (this.#mode === 'high') {
            return 4;
        } else if (this.#mode === 'ultra') {
            return 2;
        }
    }

    /**
     *
     * @private
     * @description Get video bitrate from bytes
     * @param {number} bytes
     * @returns {number}
     */
    #getBitrate(bytes) {
        const oneMB = 1000000;
        const bit = 28;

        const diff = Math.floor(bytes / oneMB);

        if (diff < 10) {
            return 128 * diff * this.#getBitrateMultiplier();
        } else {
            return Math.floor(diff * bit * 1.1);
        }
    }

    /**
     *
     * @private
     * @description Get the video codec
     * @returns {'libx264' | 'libx265'}
     */
    #getCodec() {
        if (this.#codec === 'h264') {
            return 'libx264';
        } else if (this.#codec === 'h265') {
            return 'libx265';
        }
    }

    /**
     *
     * @private
     * @description Get the ffmpeg output options
     * @returns {string[]}
     */
    #getOutputOptions() {
        if (this.#codec === 'h264') {
            return ['-preset slow', '-c:a aac', `-c:v ${this.#getCodec()}`];
        } else if (this.#codec === 'h265') {
            return ['-preset slow', '-c:a aac', `-c:v ${this.#getCodec()}`];
        }
    }

    /**
     *
     * @private
     * @description Compress the video
     * @param {number} bitrate
     * @returns {Promise<void>}
     */
    #compress(bitrate) {
        return new Promise((resolve, reject) => {
            ffmpeg(this.#input)
                .outputOptions([...this.#getOutputOptions(), `-b:v ${bitrate}k`])
                .output(this.#output)
                .on('start', () => {
                    console.log('Compressing...');
                })
                .on('error', (err) => reject(err))
                .on('end', () => resolve())
                .run();
        });
    }

    /**
     *
     * @public
     * @description Handler for the video compress
     * @returns {Promise<import("./types/HandleResult").default>}
     */
    handle() {
        return new Promise(async (resolve, reject) => {
            try {
                const inputMetadata = await this.#extractMetadata(this.#input);
                const bitrate = this.#getBitrate(inputMetadata.format.size);

                await this.#compress(bitrate);

                const outputMetadata = await this.#extractMetadata(this.#output);

                resolve({
                    oldSize: {
                        str: fileSize(inputMetadata.format.size),
                        bytes: inputMetadata.format.size,
                    },
                    newSize: {
                        str: fileSize(outputMetadata.format.size),
                        bytes: outputMetadata.format.size,
                    },
                    per: (
                        ((inputMetadata.format.size - outputMetadata.format.size) /
                            outputMetadata.format.size) *
                        100
                    ).toFixed(2),
                });
            } catch (err) {
                reject(err);
            }
        });
    }
}
