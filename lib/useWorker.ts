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

  async execCode(func: Function, ...args: any[]) {
    this.addArgs(...args);
    const data = await this.message("execCode", func.toString());
    return data;
  }

  addArgs(...args: any[]) {
    this.argList = this.argList.concat(args);
    this.send(
      "addArgs",
      this.argList.map((i) => {
        if (typeof i === "function") {
          return { type: "function", value: i.toString() };
        } else if (typeof i === "object") {
          return { type: "object", value: i };
        } else {
          return { type: "normal", value: i };
        }
      })
    );
  }

  end() {
    this.worker.terminate();
    this.worker = null;
  }
}
