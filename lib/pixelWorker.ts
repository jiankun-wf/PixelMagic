export class PixelWorker {
  argList: any[];
  worker: Worker;

  constructor(url: string) {
    this.worker = new Worker(url);
  }

  send(key: string, data: any) {
    this.worker.postMessage({ __evt_name: key, value: data });
  }

  message(key: string, data: any) {
    return new Promise((resolve) => {
      this.worker.onmessage = (e) => {
        const { data: backData } = e;
        const { __evt_name, value } = backData;
        if (__evt_name === key) {
          resolve(value);
        }
      };

      this.send(key, data);
    });
  }

  async execCode(
    value: any,
    args: Array<{ value: any; argname: string; type?: "Mat" }>
  ): Promise<{ data: Uint8ClampedArray; index: number }> {
    this.addArgs(args);
    const data = (await this.message("execCode", value)) as {
      data: Uint8ClampedArray;
      index: number;
    };
    return data;
  }

  // 将arg逐个添加到argList中
  // { argName: string; value: any; type: 'function' | 'normal' }[]
  addArgs(args: Array<{ value: any; argname: string }>) {
    this.argList = args;
    this.send(
      "addArgs",
      this.argList.map((i) => {
        const { value, argname, type } = i;
        if (typeof value === "function") {
          return { type: "function", value: value.toString(), argname };
        } else if (type) {
          return { type: "Mat", value, argname };
        } else {
          return { type: "normal", value, argname };
        }
      })
    );
  }

  end() {
    this.worker.terminate();
    this.worker = null;
  }
}
