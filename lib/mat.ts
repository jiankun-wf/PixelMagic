import type { ImageSplitChunk, Pixel } from "./type";
import { errorlog } from "./log";

export class Mat {
  // 最小分割宽高
  static minPixelSplitWidth = 400;
  static minPixelSplitHeight = 400;

  // 图像切片处理，当超过 minPixelSplitWidth * minPixelSplitHeight 时
  // 分割为最大线程数的切片，交付每一个线程处理
  static group(width: number, height: number) {
    const m = window.navigator.hardwareConcurrency;

    const points: ImageSplitChunk[] = [];
    // 均分处理的像素至每个进程
    // 注意。一定要为高度切割，这样组合的时候很简单，直接堆叠就可以。
    const splitAddress = Math.floor(height / m) - 1;
    const extraAddress = (height % m) - 1;
    let ch = 0;
    while (ch < height) {
      if (points.length + 1 < m) {
        points.push({
          x1: 0,
          y1: ch,
          x2: width - 1,
          y2: ch + splitAddress,
        });
        ch += splitAddress + 1;
      } else {
        points.push({
          x1: 0,
          y1: ch,
          x2: width - 1,
          y2: ch + splitAddress + extraAddress,
        });
        ch += splitAddress + extraAddress + 2;
      }
    }
    return points;
  }

  rows: number;
  cols: number;
  channels: number;
  size: { width: number; height: number };
  data: Uint8ClampedArray;

  constructor(imageData: ImageData) {
    this.rows = imageData.height;
    this.cols = imageData.width;
    this.size = { width: imageData.width, height: imageData.height };
    this.channels = 4;
    this.data = imageData.data;
  }

  clone() {
    const {
      data,
      size: { width, height },
    } = this;

    const uin = new Uint8ClampedArray(data);

    const imageData = new ImageData(uin, width, height);

    return new Mat(imageData);
  }

  delete() {
    this.data = new Uint8ClampedArray(0);
  }

  update(row: number, col: number, ...args: number[]) {
    const { data } = this;
    const pixelAddress = this.getAddress(row, col);

    for (let i = 0; i < 4; i++) {
      if (args[i] !== void 0) {
        data[pixelAddress[i]] = args[i];
      }
    }
  }

  getAddress(row: number, col: number) {
    const { channels, cols } = this;

    // 坐标解析，根据x行y列，计算数据的索引值
    // 本质为换行查找
    // 一行的列数 * 所在行数 * 通道数 为走过的行像素数；
    // 所在列数 * 通道数为 该行走过的列数；
    // 则 R为所得的索引值 G、B、A那就都有了

    const R = cols * col * channels + row * channels;

    return [R, R + 1, R + 2, R + 3];
  }

  // 多线程处理
  parallelForRecycle(
    callback: (pixel: Pixel, row: number, col: number, vmat: Mat, ...args: any[]) => void,
    ...args: any[]
  ) {
    const maxChannels = navigator.hardwareConcurrency;
    if (
      maxChannels <= 1 ||
      this.rows * this.cols <= Mat.minPixelSplitWidth * Mat.minPixelSplitHeight
    ) {
      // 低于 minPixelSplitHeight * minPixelSplitWidth 时，直接使用单线程处理
      // 当线程数小于等于1时，直接使用单线程处理
      return this.recycle(callback as any);
    }
    return new Promise((resolve) => {
      const {
        size: { width, height },
      } = this;
      const groups: ImageSplitChunk[] = Mat.group(width, height);

      const workers: Worker[] = [];
      let completeCount = 0;

      for (let i = 0; i < groups.length; i++) {
        const { x1, y1, x2, y2 } = groups[i];

        const worker = new Worker("/modules/iife/exec.worker.js");

        worker.onmessage = (e: MessageEvent) => {
          const { data, index } = e.data;
          groups[i].data = data;
          completeCount++;
          worker.terminate();
          if (completeCount === workers.length) {
            let total = 0;
            const resultArr = new Uint8ClampedArray(width * height * 4);
            for (let i = 0; i < groups.length; i++) {
              resultArr.set(groups[i].data, total);
              total += groups[i].data.length;
            }
            const newMat = new Mat(new ImageData(resultArr, width, height));
            resolve(newMat);
            workers.splice(0, workers.length);
          }
        };
        workers.push(worker);

        worker.postMessage({
          startX: x1,
          startY: y1,
          endX: x2,
          endY: y2,
          data: this.data,
          width,
          height,
          index: i,
          callbackStr: callback.toString(),
          callbackArguments: args,
        });
      }
    });
  }

  recycle(
    callback: (pixel: Pixel, row: number, col: number) => void | "break",
    startX = 0,
    endX = this.cols,
    startY = 0,
    endY = this.rows
  ) {
    for (let row = startX; row < endX; row++) {
      for (let col = startY; col < endY; col++) {
        callback(this.at(row, col) as Pixel, row, col);
      }
    }
  }

  at(row: number, col: number) {
    const { data } = this;

    const [R, G, B, A] = this.getAddress(row, col);

    return [data[R], data[G], data[B], data[A]];
  }

  // clip 是否缩放，注意这个缩放不会影响本身mat图片数据，只做展示缩放
  imgshow(
    canvas: HTMLCanvasElement | string,
    clip = false,
    clipWidth = 0,
    clipHeight = 0
  ) {
    const canvasEl =
      canvas instanceof HTMLCanvasElement
        ? canvas
        : document.querySelector<HTMLCanvasElement>(canvas);
    if (!canvasEl) {
      errorlog("无法找到canvas当前元素！");
    }
    const { data, size } = this;
    const { width, height } = size;
    const imageData = new ImageData(data, width, height);

    const ctx = canvasEl.getContext("2d");

    if (clip) {
      canvasEl.width = clipWidth;
      canvasEl.height = clipHeight;
      window
        .createImageBitmap(imageData, {
          resizeHeight: clipHeight,
          resizeWidth: clipWidth,
        })
        .then((imageBitmap) => {
          ctx.drawImage(imageBitmap, 0, 0);
        });
    } else {
      canvasEl.width = width;
      canvasEl.height = height;

      ctx.putImageData(imageData, 0, 0, 0, 0, canvasEl.width, canvasEl.height);
    }
  }

  toDataUrl(type?: string, quality = 1) {
    const canvas = document.createElement("canvas");

    this.imgshow(canvas);

    return canvas.toDataURL(type ?? "image/png", quality);
  }

  toBlob(type?: string, quality = 1) {
    return new Promise<Blob>((resolve, reject) => {
      const canvas = document.createElement("canvas");

      this.imgshow(canvas);

      canvas.toBlob(
        (blob: Blob | null) => {
          if (!blob || !blob.size) {
            return reject(new Error("转换失败：不存在的blob或blob大小为空"));
          }
          resolve(blob);
        },
        type ?? "image/png",
        quality
      );
    });
  }
}
