import { useEffect, useRef, useState } from 'react';
import { Client, IMessage } from '@stomp/stompjs';
import { requestWsTicket } from '@/lib/api';
import { getStompBrokerUrl } from '@/lib/wsUrl';
import type { WsMessagePayload } from '@/types/chat';

export function useStompRoom(
  roomId: string | undefined,
  onEvent: (payload: WsMessagePayload) => void,
) {
  const [connected, setConnected] = useState(false);
  const clientRef = useRef<Client | null>(null);
  const onEventRef = useRef(onEvent);
  onEventRef.current = onEvent;

  useEffect(() => {
    if (!roomId) {
      return undefined;
    }
    let cancelled = false;
    let client: Client | null = null;

    (async () => {
      try {
        const ticket = await requestWsTicket();
        if (cancelled) return;
        const c = new Client({
          brokerURL: getStompBrokerUrl(ticket),
          reconnectDelay: 5000,
          onConnect: () => {
            if (cancelled) return;
            setConnected(true);
            c.subscribe(`/topic/rooms.${roomId}`, (msg: IMessage) => {
              try {
                const payload = JSON.parse(msg.body) as WsMessagePayload;
                onEventRef.current(payload);
              } catch {
                /* ignore */
              }
            });
          },
          onDisconnect: () => setConnected(false),
          onWebSocketClose: () => setConnected(false),
        });
        client = c;
        clientRef.current = c;
        c.activate();
      } catch {
        setConnected(false);
      }
    })();

    return () => {
      cancelled = true;
      clientRef.current?.deactivate();
      clientRef.current = null;
      setConnected(false);
    };
  }, [roomId]);

  const sendTyping = (typing: boolean) => {
    const client = clientRef.current;
    if (!client?.connected || !roomId) return;
    client.publish({
      destination: `/app/rooms/${roomId}/typing`,
      body: JSON.stringify({ typing }),
    });
  };

  return { connected, sendTyping };
}
