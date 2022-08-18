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
     * @description Video compression preset
     * @type {?('low' | 'medium' | 'high' | 'veryHigh' | 'ultra')}
     */
    #preset = null;

    /**
     *
     * @constructor
     * @param {import("./types/IOptions").default} options
     */
    constructor({ input, output, codec, preset }) {
        this.#input = input;
        this.#output = output;
        this.#codec = codec;
        this.#preset = preset;

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
     * @description Get the bitrate divider
     * @returns {number}
     */
    #getBitrateDivider() {
        if (this.#preset === 'low') {
            return 1.6;
        } else if (this.#preset === 'medium') {
            return 2.4;
        } else if (this.#preset === 'high') {
            return 3.2;
        } else if (this.#preset === 'veryHigh') {
            return 4.3;
        } else if (this.#preset === 'ultra') {
            return 5.1;
        }
    }

    /**
     *
     * @private
     * @description Get video bitrate from bytes
     * @param {number} bitrate
     * @returns {number}
     */
    #getBitrate(bitrate) {
        return Math.floor(bitrate / this.#getBitrateDivider());
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
            return [`-c:v ${this.#getCodec()}`, '-preset slow'];
        } else if (this.#codec === 'h265') {
            return [`-c:v ${this.#getCodec()}`, '-preset slow'];
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
                .outputOptions([...this.#getOutputOptions(), `-b:v ${bitrate}`])
                .output(this.#output)
                .on('start', () => {
                    console.log('Compress started.');
                })
                .on('error', (err) => reject(err))
                .on('end', () => resolve())
                .on('progress', (progress) => {
                    console.clear();
                    console.log('Compressing...\n');
                    console.log(
                        `Frames: ${progress.frames} | FPS: ${
                            progress.currentFps
                        } | Bitrate: ${Math.floor(
                            progress.currentKbps
                        )} | Completion: ${progress.percent.toFixed(2)}%`
                    );
                })
                .run();
        });
    }

    /**
     *
     * @public
     * @description Run the compression
     * @returns {Promise<import("./types/HandleResult").default>}
     */
    run() {
        return new Promise(async (resolve, reject) => {
            try {
                const inputMetadata = await this.#extractMetadata(this.#input);
                const bitrate = this.#getBitrate(inputMetadata.format.bit_rate);

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
