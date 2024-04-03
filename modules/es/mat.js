import { errorlog } from "./log";
class Mat {
  // 最小分割宽高
  static minPixelSplitWidth = 400;
  static minPixelSplitHeight = 400;
  static group(width, height) {
    const m = window.navigator.hardwareConcurrency;
    const points = [];
    const splitAddress = Math.floor(height / m) - 1;
    const extraAddress = height % m - 1;
    let ch = 0;
    while (ch < height) {
      if (points.length + 1 < m) {
        points.push({
          x1: 0,
          y1: ch,
          x2: width - 1,
          y2: ch + splitAddress
        });
        ch += splitAddress + 1;
      } else {
        points.push({
          x1: 0,
          y1: ch,
          x2: width - 1,
          y2: ch + splitAddress + extraAddress
        });
        ch += splitAddress + extraAddress + 2;
      }
    }
    return points;
  }
  rows;
  cols;
  channels;
  size;
  data;
  constructor(imageData) {
    this.rows = imageData.height;
    this.cols = imageData.width;
    this.size = { width: imageData.width, height: imageData.height };
    this.channels = 4;
    this.data = imageData.data;
  }
  clone() {
    const {
      data,
      size: { width, height }
    } = this;
    const uin = new Uint8ClampedArray(data);
    const imageData = new ImageData(uin, width, height);
    return new Mat(imageData);
  }
  delete() {
    this.data = new Uint8ClampedArray(0);
  }
  update(row, col, ...args) {
    const { data } = this;
    const pixelAddress = this.getAddress(row, col);
    for (let i = 0; i < 4; i++) {
      if (args[i] !== void 0) {
        data[pixelAddress[i]] = args[i];
      }
    }
  }
  getAddress(row, col) {
    const { channels, cols } = this;
    const R = cols * col * channels + row * channels;
    return [R, R + 1, R + 2, R + 3];
  }
  // 多线程处理
  parallelForRecycle(callback) {
    const maxChannels = navigator.hardwareConcurrency;
    if (maxChannels <= 1 || this.rows * this.cols <= Mat.minPixelSplitWidth * Mat.minPixelSplitHeight) {
      return this.recycle(callback);
    }
    return new Promise((resolve) => {
      const {
        size: { width, height }
      } = this;
      const groups = Mat.group(width, height);
      const works = [];
      let completeCount = 0;
      for (let i = 0; i < groups.length; i++) {
        const { x1, y1, x2, y2 } = groups[i];
        const worker = new Worker("/modules/iife/exec.worker.js");
        worker.onmessage = (e) => {
          const { data, index } = e.data;
          groups[i].data = data;
          completeCount++;
          if (completeCount === works.length) {
            let total = 0;
            const resultArr = new Uint8ClampedArray(width * height * 4);
            for (let i2 = 0; i2 < groups.length; i2++) {
              resultArr.set(groups[i2].data, total);
              total += groups[i2].data.length;
            }
            const newMat = new Mat(new ImageData(resultArr, width, height));
            resolve(newMat);
          }
        };
        works.push(worker);
        worker.postMessage({
          startX: x1,
          startY: y1,
          endX: x2,
          endY: y2,
          data: this.data,
          width,
          height,
          index: i
        });
      }
    });
  }
  recycle(callback, startX = 0, endX = this.cols, startY = 0, endY = this.rows) {
    for (let row = startX; row < endX; row++) {
      for (let col = startY; col < endY; col++) {
        callback(this.at(row, col), row, col);
      }
    }
  }
  at(row, col) {
    const { data } = this;
    const [R, G, B, A] = this.getAddress(row, col);
    return [data[R], data[G], data[B], data[A]];
  }
  // clip 是否缩放，注意这个缩放不会影响本身mat图片数据，只做展示缩放
  imgshow(canvas, clip = false, clipWidth = 0, clipHeight = 0) {
    const canvasEl = canvas instanceof HTMLCanvasElement ? canvas : document.querySelector(canvas);
    if (!canvasEl) {
      errorlog("\u65E0\u6CD5\u627E\u5230canvas\u5F53\u524D\u5143\u7D20\uFF01");
    }
    const { data, size } = this;
    const { width, height } = size;
    const imageData = new ImageData(data, width, height);
    const ctx = canvasEl.getContext("2d");
    if (clip) {
      canvasEl.width = clipWidth;
      canvasEl.height = clipHeight;
      window.createImageBitmap(imageData, {
        resizeHeight: clipHeight,
        resizeWidth: clipWidth
      }).then((imageBitmap) => {
        ctx.drawImage(imageBitmap, 0, 0);
      });
    } else {
      canvasEl.width = width;
      canvasEl.height = height;
      ctx.putImageData(imageData, 0, 0, 0, 0, canvasEl.width, canvasEl.height);
    }
  }
  toDataUrl(type, quality = 1) {
    const canvas = document.createElement("canvas");
    this.imgshow(canvas);
    return canvas.toDataURL(type ?? "image/png", quality);
  }
  toBlob(type, quality = 1) {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement("canvas");
      this.imgshow(canvas);
      canvas.toBlob(
        (blob) => {
          if (!blob || !blob.size) {
            return reject(new Error("\u8F6C\u6362\u5931\u8D25\uFF1A\u4E0D\u5B58\u5728\u7684blob\u6216blob\u5927\u5C0F\u4E3A\u7A7A"));
          }
          resolve(blob);
        },
        type ?? "image/png",
        quality
      );
    });
  }
}
export {
  Mat
};
