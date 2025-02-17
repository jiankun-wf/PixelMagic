var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);
var mat_exports = {};
__export(mat_exports, {
  Mat: () => Mat
});
module.exports = __toCommonJS(mat_exports);
var import_log = require("./log");
var import_pixelWorker = require("./pixelWorker");
class Mat {
  // 最小分割宽高
  static minPixelSplitWidth = 400;
  static minPixelSplitHeight = 400;
  // 图像切片处理，当超过 minPixelSplitWidth * minPixelSplitHeight 时
  // 分割为最大线程数的切片，交付每一个线程处理
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
        const ext = extraAddress < 0 ? 0 : extraAddress;
        points.push({
          x1: 0,
          y1: ch,
          x2: width - 1,
          y2: ch + splitAddress + ext
        });
        ch += splitAddress + ext + 2;
      }
    }
    const [{ x1, y1, x2, y2 }] = points;
    return { points, indexsize: (y2 - y1 + 1) * (x2 - x1 + 1) * 4 };
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
  parallelForRecycle(callback, args) {
    const maxChannels = window.navigator.hardwareConcurrency;
    const { rows, cols } = this;
    const { minPixelSplitHeight, minPixelSplitWidth } = Mat;
    if (!window.Worker) {
      return this.recycleWithoutWorker(callback, args);
    }
    if (!window.navigator.hardwareConcurrency || maxChannels < 2) {
      return this.recycleWithoutWorker(callback, args);
    }
    if (rows * cols <= minPixelSplitWidth * minPixelSplitHeight) {
      return this.recycleWithoutWorker(callback, args);
    }
    const d = performance.now();
    return new Promise((resolve) => {
      const {
        size: { width, height }
      } = this;
      const { points: groups, indexsize } = Mat.group(width, height);
      const workers = [];
      let completeCount = 0;
      const resultArr = new Uint8ClampedArray(width * height * 4);
      for (let i = 0; i < groups.length; i++) {
        const { x1, y1, x2, y2 } = groups[i];
        const worker = new import_pixelWorker.PixelWorker("./modules/iife/exec.worker.js");
        workers.push(worker);
        worker.execCode(
          {
            startX: x1,
            startY: y1,
            endX: x2,
            endY: y2,
            data: this.data,
            width,
            height,
            index: i,
            callbackStr: callback.toString()
          },
          args
        ).then((res) => {
          const { data, index } = res;
          resultArr.set(data, indexsize * index);
          completeCount++;
          worker.end();
          if (completeCount === workers.length) {
            const newMat = new Mat(new ImageData(resultArr, width, height));
            resolve(newMat);
            const de = performance.now();
            console.log(
              `\u7EBF\u7A0B\u6570\uFF1A${window.navigator.hardwareConcurrency}\uFF0C\u591A\u7EBF\u7A0B\u4EFB\u52A1\u8017\u65F6\uFF1A`,
              de - d,
              "ms"
            );
            workers.splice(0, workers.length);
          }
        });
      }
    });
  }
  recycleWithoutWorker(callback, args) {
    const argsContext = Mat.computedArgs(args);
    const c = callback.bind(argsContext);
    this.recycle((pixel, row, col) => {
      c(pixel, row, col, this);
    });
    return this;
  }
  recycle(callback, startX = 0, endX = this.cols, startY = 0, endY = this.rows) {
    for (let row = startX; row < endX; row++) {
      for (let col = startY; col < endY; col++) {
        callback(this.at(row, col), row, col);
      }
    }
    return this;
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
      (0, import_log.errorlog)("\u65E0\u6CD5\u627E\u5230canvas\u5F53\u524D\u5143\u7D20\uFF01");
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
  static computedArgs(value) {
    const argsContext = {
      self
    };
    if (value && value.length) {
      value.forEach(({ type, value: itemValue, argname }) => {
        if (typeof value === "function") {
          const func = new Function(`return ${itemValue}`);
          const funcContext = func();
          argsContext[argname] = funcContext.bind(argsContext);
        } else if (type === "Mat") {
          const { data, width, height } = itemValue;
          argsContext[argname] = new Mat(new ImageData(data, width, height));
        } else {
          argsContext[argname] = itemValue;
        }
      });
    }
    return argsContext;
  }
}
