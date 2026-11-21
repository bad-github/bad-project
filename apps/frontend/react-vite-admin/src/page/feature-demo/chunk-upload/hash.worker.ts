import {md5} from 'hash-wasm';

globalThis.onmessage = async (event: MessageEvent) => {
  try {
    const file: File = event.data.file;
    const fileBuffer = await file.arrayBuffer();
    const hash = await md5(new Uint8Array(fileBuffer));
    postMessage({hash});
  } catch (error) {
    console.error(error);
  }
};
