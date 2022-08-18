import Compressor from '../src/index.js';

const compressor = new Compressor({
    input: 'input.mp4', //input filepath
    output: 'output.mp4', //output filepath
    codec: 'h264', //or: h265
    mode: 'low', //or: medium, high, ultra
});

compressor
    .handle()
    .then(({ oldSize, newSize, per }) => {
        console.log(`Conversion completed!\n`);
        console.log(`Old size: ${oldSize.str}`);
        console.log(`New size: ${newSize.str}`);
        console.log(`\nConversion ratio: ${per}%`);
    })
    .catch(console.error);
