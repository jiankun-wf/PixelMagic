var import_mat = require("./mat");
self.addEventListener("message", (e) => {
  const argsContext = {
    self
  };
  const { __evt_name, value } = e.data;
  switch (__evt_name) {
    case "addArgs":
      if (value && value.length) {
        value.forEach(({ type, value: itemValue, argname }) => {
          if (type === "function") {
            const func = new Function(`return ${itemValue}`);
            const funcContext = func();
            argsContext[argname] = funcContext.bind(argsContext);
          } else if (type === "Mat") {
            const { data: data2, width: width2, height: height2 } = itemValue;
            argsContext[argname] = new import_mat.Mat(new ImageData(data2, width2, height2));
          } else {
            argsContext[argname] = itemValue;
          }
        });
      }
      return;
    case "execCode":
      const {
        startX,
        startY,
        endX,
        endY,
        data,
        width,
        height,
        index,
        callbackStr
      } = value;
      const callbackFunction = new Function(
        "pixel",
        "row",
        "col",
        "vmat",
        `return ${callbackStr}`
      );
      const imageData = new ImageData(data, width, height);
      const mat = new import_mat.Mat(imageData);
      const callback = callbackFunction.bind(argsContext);
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
          index
        }
      });
      return;
  }
});
