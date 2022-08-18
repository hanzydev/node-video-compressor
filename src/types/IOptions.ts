export default interface IOptions {
    input: string;
    output: string;
    codec: 'h264' | 'h265';
    preset: 'low' | 'medium' | 'high' | 'veryHigh' | 'ultra';
}
