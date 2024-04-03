import { Mat } from "./mat";

self.addEventListener("message", (e: MessageEvent) => {
  const { startX, startY, endX, endY, data, width, height, index, callbackStr, callbackArguments } = e.data;

  const imageData = new ImageData(data, width, height);

  const mat = new Mat(imageData);

  const cw = endX - startX + 1;
  const ch = endY - startY + 1;
  const nMat = new Mat(
    new ImageData(new Uint8ClampedArray(cw * ch * 4), cw, ch)
  );

  const callbackFunction = new Function('pixel', 'row', 'col', '...args', `return ${callbackStr}`);
  const callback = callbackFunction();

  mat.recycle(
    (pixel, row, col) => {
      callback(pixel, row, col, nMat, row - startX, col - startY, ...callbackArguments);
    },
    startX,
    endX + 1,
    startY,
    endY + 1
  );

  self.postMessage({
    data: nMat.data,
    index,
  });
});
