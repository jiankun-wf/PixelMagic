self.addEventListener("message", (e: MessageEvent) => {
  const { callback, mat, startX, endX, startY, endY } = e.data;

  mat.recycle(
    (pixel, row, col) => {
      mat.update(row, col, void 0, void 0, void 0, 100);
    },
    startX,
    endX,
    startY,
    endY
  );

  self.postMessage({ startX, endX, startY, endY });
});
