import type { CallBack, ImageSplitChunk } from "./type";
export declare class Mat {
    static minPixelSplitWidth: number;
    static minPixelSplitHeight: number;
    static group(width: number, height: number): ImageSplitChunk[];
    rows: number;
    cols: number;
    channels: number;
    size: {
        width: number;
        height: number;
    };
    data: Uint8ClampedArray;
    constructor(imageData: ImageData);
    clone(): Mat;
    delete(): void;
    update(row: number, col: number, ...args: number[]): void;
    getAddress(row: number, col: number): number[];
    parallelForRecycle(callback: CallBack, args: Array<{
        value: any;
        argname: string;
        type?: "Mat";
    }>): this | Promise<unknown>;
    recycle(callback: CallBack, startX?: number, endX?: number, startY?: number, endY?: number, arg?: any): this;
    at(row: number, col: number): number[];
    imgshow(canvas: HTMLCanvasElement | string, clip?: boolean, clipWidth?: number, clipHeight?: number): void;
    toDataUrl(type?: string, quality?: number): string;
    toBlob(type?: string, quality?: number): Promise<Blob>;
}
