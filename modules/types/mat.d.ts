import type { ImageSplitChunk, Pixel } from "./type";
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
    parallelForRecycle(callback: (pixel: Pixel, row: number, col: number, vmat: Mat, ...args: any[]) => void, ...args: any[]): void | Promise<unknown>;
    recycle(callback: (pixel: Pixel, row: number, col: number) => void | "break", startX?: number, endX?: number, startY?: number, endY?: number): void;
    at(row: number, col: number): number[];
    imgshow(canvas: HTMLCanvasElement | string, clip?: boolean, clipWidth?: number, clipHeight?: number): void;
    toDataUrl(type?: string, quality?: number): string;
    toBlob(type?: string, quality?: number): Promise<Blob>;
}
