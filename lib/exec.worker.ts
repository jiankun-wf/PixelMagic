self.addEventListener("message", (e: MessageEvent) => {
  const { callback, mat, startX, endX, startY, endY } = e.data;
  for (let x = startX; x < endX; x++) {
    for (let y = startY; y < endY; y++) {
      const pixel = mat.at(x, y);
      callback(pixel, x, y);
    }
  }

  self.postMessage({ startX, endX, startY, endY });
});
