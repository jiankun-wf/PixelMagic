import { Mat } from "./mat";

self.addEventListener("message", (e: MessageEvent) => {
  const argsContext = {
    self: self,
  };

  const { __evt_name, value } = e.data;

  switch (__evt_name) {
    // 为函数的执行指定args与作用域

    case "addArgs":
      if (value && value.length) {
        value.forEach(({ type, value: itemValue, argname }) => {
          if (type === "function") {
            const func = new Function(`return ${itemValue}`);
            const funcContext = func();
            argsContext[argname] = funcContext.bind(argsContext);
          } else if (type === "Mat") {
            // 为mat时，为Uint8ClampedArray数据
            const { data, width, height } = itemValue;
            argsContext[argname] = new Mat(new ImageData(data, width, height));
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
        callbackStr,
      } = value;
    
      const callbackFunction = new Function(
        "pixel",
        "row",
        "col",
        "vmat",
        `return ${callbackStr}`
      );

      const imageData = new ImageData(data, width, height);

      const mat = new Mat(imageData);

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
          index,
        },
      });

      return;
  }
});
