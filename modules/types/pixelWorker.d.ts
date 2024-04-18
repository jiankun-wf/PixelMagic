export declare class PixelWorker {
    argList: any[];
    worker: Worker;
    constructor(url: string);
    send(key: string, data: any): void;
    message(key: string, data: any): Promise<unknown>;
    execCode(value: any, args: Array<{
        value: any;
        argname: string;
        type?: "Mat";
    }>): Promise<{
        data: Uint8ClampedArray;
        index: number;
    }>;
    addArgs(args: Array<{
        value: any;
        argname: string;
    }>): void;
    end(): void;
}
