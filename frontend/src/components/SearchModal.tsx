import { useEffect, useState } from 'react';
import { Search, X } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api';
import type { Message } from '@/types/chat';

interface SearchModalProps {
  roomId: string;
  roomName: string;
  onClose: () => void;
  formatTime: (v: string) => string;
}

async function json<T>(r: Response): Promise<T> {
  if (!r.ok) throw new Error((await r.text()) || `${r.status}`);
  return r.json() as Promise<T>;
}

export default function SearchModal({ roomId, roomName, onClose, formatTime }: SearchModalProps) {
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');

  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(query.trim()), 300);
    return () => clearTimeout(t);
  }, [query]);

  const { data: results = [], isLoading } = useQuery({
    queryKey: ['search', roomId, debouncedQuery],
    queryFn: async () =>
      json<Message[]>(await apiFetch(`/api/rooms/${roomId}/messages/search?${new URLSearchParams({ q: debouncedQuery, limit: '20' })}`)),
    enabled: debouncedQuery.length >= 2,
    staleTime: 30000,
    retry: false,
  });

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div className="pm-modal-backdrop" onClick={onClose}>
      <div className="pm-modal pm-search-modal" onClick={e => e.stopPropagation()}>
        <div className="pm-search-modal__header">
          <Search size={15} style={{ color: 'var(--pm-text-muted)', flexShrink: 0 }} />
          <input
            className="pm-input pm-input--sm"
            style={{ flex: 1, border: 'none', background: 'transparent', outline: 'none', padding: '0 4px' }}
            placeholder={`Search in ${roomName}…`}
            value={query}
            onChange={e => setQuery(e.target.value)}
            autoFocus
          />
          <button className="pm-icon-btn" style={{ border: 'none', flexShrink: 0 }} onClick={onClose} title="Close">
            <X size={15} />
          </button>
        </div>
        <div className="pm-search-modal__results">
          {debouncedQuery.length < 2 && (
            <div className="pm-empty" style={{ padding: '32px 0' }}>
              <div className="pm-empty__sub">Type at least 2 characters to search</div>
            </div>
          )}
          {debouncedQuery.length >= 2 && isLoading && (
            <div style={{ padding: '20px', textAlign: 'center', color: 'var(--pm-text-muted)', fontSize: 13 }}>
              Searching…
            </div>
          )}
          {debouncedQuery.length >= 2 && !isLoading && results.length === 0 && (
            <div className="pm-empty" style={{ padding: '32px 0' }}>
              <div className="pm-empty__sub">No messages found for "{debouncedQuery}"</div>
            </div>
          )}
          {results.map(msg => (
            <div key={msg.id} className="pm-search-result">
              <div className="pm-search-result__header">
                <span className="pm-search-result__sender">{msg.senderDisplayName}</span>
                <span className="pm-search-result__time">{formatTime(msg.createdAt)}</span>
              </div>
              <div className="pm-search-result__content">{msg.content}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
