/**
 * WebSocket URL for STOMP. Dev: same origin + Vite proxy. Prod: same host as API if VITE_API_BASE_URL is set.
 */
export function getStompBrokerUrl(ticket: string): string {
  const api = import.meta.env.VITE_API_BASE_URL;
  if (api) {
    try {
      const u = new URL(api);
      const wsProto = u.protocol === 'https:' ? 'wss:' : 'ws:';
      return `${wsProto}//${u.host}/ws?ticket=${encodeURIComponent(ticket)}`;
    } catch {
      /* ignore */
    }
  }
  const proto = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  return `${proto}//${window.location.host}/ws?ticket=${encodeURIComponent(ticket)}`;
}
