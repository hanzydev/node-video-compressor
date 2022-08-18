interface Size {
    str: string;
    bytes: number;
}

export default interface HandleResult {
    oldSize: Size;
    newSize: Size;
    per: number;
}
