import {useEffect, useRef} from 'react';
import {receiveSocket} from '@/request/common';
import {buildSocketUrl} from '@/utils/tool';
import {Button} from '@badnpm/ui';

export default function WebSocketPage() {
  const socket = useRef<WebSocket | null>(null);

  const connect = () => {
    // todo
    socket.current = new WebSocket(`${buildSocketUrl()}/common`);
    if (!socket?.current) return;
    socket.current.onopen = () => {
      console.log('连接成功');
    };
    socket.current.onmessage = (e) => {
      console.log('客户端收到服务端的消息', e.data);
    };
    socket.current.onerror = (e) => {
      console.log('连接失败', e);
      throw e;
    };
    socket.current.onclose = () => {
      console.log('连接关闭');
    };
  };
  useEffect(() => {
    connect();
  }, []);

  const sendMessage = () => {
    socket.current?.send('客户端发送给服务端的消息');
  };
  const receiveMessage = async () => {
    const result = await receiveSocket();
    console.log(result);
  };

  return (
    <div className="mt-4 flex flex-wrap gap-2">
      <Button onClick={sendMessage}>websocket[客户端发送消息]</Button>
      <Button onClick={receiveMessage}>websocket[服务端发送消息]</Button>
    </div>
  );
}
