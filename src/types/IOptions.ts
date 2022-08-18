export default interface IOptions {
    input: string;
    output: string;
    codec: 'h264' | 'h265';
    mode: 'low' | 'medium' | 'high' | 'ultra';
}
