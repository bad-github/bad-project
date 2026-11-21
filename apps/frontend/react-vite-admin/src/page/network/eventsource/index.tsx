import {pushMsg} from '@/request/common';
import {API_PREFIX} from '@/request/ky';
import {Button} from '@badnpm/ui';
import {fetchEventSource} from '@microsoft/fetch-event-source';
import {useEffect, useRef} from 'react';

// fetch-event-source 没有最大重试次数配置，需要在 onerror 中自行计数。
const MAX_RETRIES = 0;

export default function EventSourcePage() {
  const subscribeController = useRef<AbortController | null>(null);

  const connect = () => {
    subscribeController.current?.abort();
    const controller = new AbortController();
    // 每次手动建立连接时重新计算该连接的重试次数。
    let retryCount = 0;
    subscribeController.current = controller;

    void fetchEventSource(`${API_PREFIX}/events`, {
      // 跨域请求时携带 Cookie；同源请求也可以保留此配置。
      credentials: 'include',
      // 调用 controller.abort() 会立即关闭当前 SSE 连接并停止后续重试。
      signal: controller.signal,
      // true：页面切到后台时仍保持连接；默认 false，会在页面隐藏时断开，重新显示时自动连接。
      openWhenHidden: true,
      // 收到 HTTP 响应后、开始读取事件流前执行，适合检查状态码和响应类型。
      async onopen(response) {
        if (!response.ok) {
          const problem = await response.json();
          console.error('可以连接，但失败', problem);
          throw Object.assign(new Error(`${response.status} ${response.statusText}`.trim()), {
            status: response.status,
            statusText: response.statusText,
            url: response.url,
          });
        }
        console.log('连接成功', response);
      },
      /**
       * 后端通过 SSE 的 event 字段指定事件类型，例如：
       * event: log.message
       * data: {"message":"日志内容"}
       *
       * 每条事件末尾必须再发送一个空行。event.event 对应上面的 log.message，
       * event.data 是 data: 后面的字符串，需要根据实际数据格式自行解析。
       */
      onmessage(event) {
        console.log('onmessage', event.event);
        switch (event.event) {
          // 后端发送 `event: log.message` 时进入这里。
          case 'log.message':
            console.log('log:', JSON.parse(event.data));
            break;
          // 后端发送 `event: warning.message` 时进入这里。
          case 'warning.message':
            console.log('warning:', JSON.parse(event.data));
            break;
          // 后端发送 `event: task.message` 时进入这里。
          case 'task.message':
            console.log('task:', JSON.parse(event.data));
            break;
          case 'demo.message':
            console.log('demo:', JSON.parse(event.data));
            break;
          // 后端未指定 event，或者发送了其他事件类型时进入这里。
          default:
            console.log('default:', event.data);
        }
      },
      // 建立连接、读取数据或执行回调时发生的错误都会进入这里。
      onerror(error) {
        console.log('连接错误', error);
        retryCount += 1;

        // onerror 正常返回时，库会按照默认间隔继续重试；抛出错误则会终止重试并 reject 外层 Promise。
        if (retryCount > MAX_RETRIES) {
          throw error;
        }
      },
    }).catch((error) => {
      // 达到最大重试次数后抛出的错误最终会进入这里。
      if (error instanceof Error && error.name !== 'AbortError') {
        console.error('连接终止', error);
        throw error;
      }
    });
  };

  const disconnect = () => {
    subscribeController.current?.abort();
    subscribeController.current = null;
  };

  useEffect(() => {
    return () => {
      subscribeController.current?.abort();
    };
  }, []);

  /* const create = () => {
    fetchRequest(`/notifications`, {
      method: 'POST',
      body: {
        title: '通知标题',
        content: '通知内容' + Date.now(),
      }
    })
  } */

  return (
    <div className="mt-4 flex flex-wrap gap-2">
      <Button onClick={() => connect()}>connect</Button>
      <Button onClick={() => disconnect()}>disconnect</Button>
      <Button onClick={() => pushMsg()}>触发推送</Button>
    </div>
  );
}
