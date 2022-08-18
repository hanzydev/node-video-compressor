import Compressor from '../src/index.js';

const compressor = new Compressor({
    input: 'input.mp4', //input filepath
    output: 'output.mp4', //output filepath
    codec: 'h264', //or: h265
    preset: 'low', //or: medium, high, veryHigh, ultra
});

compressor
    .run()
    .then(({ oldSize, newSize, per }) => {
        console.log(`\nConversion completed!\n`);
        console.log(`Old size: ${oldSize.str}`);
        console.log(`New size: ${newSize.str}\n`);
        console.log(`Conversion ratio: ${per}%`);
    })
    .catch(console.error);
