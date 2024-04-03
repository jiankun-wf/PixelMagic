import { Mat } from "./mat";

self.addEventListener("message", (e: MessageEvent) => {
  const { startX, startY, endX, endY, data, width, height, index, callbackStr, callbackArguments } = e.data;

  const imageData = new ImageData(data, width, height);

  const mat = new Mat(imageData);

  const callbackFunction = new Function('pixel', 'row', 'col', 'vmat', '...args', `return ${callbackStr}`);
  const callback = callbackFunction();

  mat.recycle(
    (pixel, row, col) => {
      callback(pixel, row, col, mat, ...callbackArguments);
    },
    startX,
    endX + 1,
    startY,
    endY + 1
  );

  const splitMatData = mat.data.slice(mat.getAddress(startX, startY)[0], mat.getAddress(endX, endY)[3] + 1);

  self.postMessage({
    data: splitMatData,
    index,
  });
});
