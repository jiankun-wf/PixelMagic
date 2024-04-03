var import_mat = require("./mat");
self.addEventListener("message", (e) => {
  const { startX, startY, endX, endY, data, width, height, index, callbackStr } = e.data;
  const imageData = new ImageData(data, width, height);
  const mat = new import_mat.Mat(imageData);
  const cw = endX - startX + 1;
  const ch = endY - startY + 1;
  const nMat = new import_mat.Mat(
    new ImageData(new Uint8ClampedArray(cw * ch * 4), cw, ch)
  );
  mat.recycle(
    (pixel, row, col) => {
      nMat.update(row - startX, col - startY, 128, 128, 128, 255);
    },
    startX,
    endX + 1,
    startY,
    endY + 1
  );
  self.postMessage({
    data: nMat.data,
    index
  });
});
