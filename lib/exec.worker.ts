import { Mat } from "./mat";
self.addEventListener("message", (e: MessageEvent) => {
  const { value } = e.data;

  const {
    startX,
    startY,
    endX,
    endY,
    data,
    width,
    height,
    index,
    callbackStr,
    argList,
  } = value;

  const argsContext = Mat.computedArgs(argList);

  const callbackFunction = new Function(
    "pixel",
    "row",
    "col",
    "vmat",
    `return ${callbackStr}`
  );

  const imageData = new ImageData(data, width, height);

  const mat = new Mat(imageData);

  const callback = callbackFunction().bind(argsContext);

  mat.recycle(
    (pixel, row, col) => {
      callback(pixel, row, col, mat);
    },
    startX,
    endX + 1,
    startY,
    endY + 1
  );

  const splitMatData = mat.data.slice(
    mat.getAddress(startX, startY)[0],
    mat.getAddress(endX, endY)[3] + 1
  );

  self.postMessage({
    __evt_name: "execCode",
    value: {
      data: splitMatData,
      index,
    },
  });
});
