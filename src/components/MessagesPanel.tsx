import { useState } from 'react';
import { useStore } from '../state/useStore';
import { TenantAvatar } from '../pages/Tenants/TenantRow';

export default function MessagesPanel() {
  const markConversationRead = useStore((s) => s.markConversationRead);
  const sendMessage = useStore((s) => s.sendMessage);
  const conversations = useStore((s) => s.conversations);
  const [openId, setOpenId] = useState<string | null>(null);
  const [draft, setDraft] = useState('');
  const open = openId ? conversations.find((c) => c.id === openId) ?? null : null;

  const send = () => {
    if (!open || draft.trim() === '') return;
    sendMessage(open.id, draft);
    setDraft('');
  };

  if (open) {
    return (
      <div className="dropdown dropdown-wide" role="dialog" aria-label={`Conversation with ${open.name}`}>
        <div className="row">
          <button className="link-btn small" type="button" onClick={() => setOpenId(null)}>← All messages</button>
        </div>
        <div className="row" style={{ marginTop: 8 }}>
          <div className="tenant-cell">
            <TenantAvatar name={open.name} />
            <div><strong>{open.name}</strong><div className="small muted">{open.context}</div></div>
          </div>
        </div>
        <div className="chat-thread">
          {open.messages.map((m) => (
            <div key={m.id} className={`chat-bubble ${m.from === 'me' ? 'me' : 'them'}`}>
              <div>{m.text}</div>
              <div className="small chat-time">{m.time}</div>
            </div>
          ))}
        </div>
        <div className="chat-reply">
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') send(); }}
            placeholder="Write a reply..."
            aria-label="Write a reply"
          />
          <button className="btn btn-teal btn-sm" type="button" onClick={send} disabled={draft.trim() === ''}>Send</button>
        </div>
      </div>
    );
  }

  return (
    <div className="dropdown dropdown-wide" role="menu" aria-label="Messages">
      <div className="row"><strong>Messages</strong></div>
      {conversations.length === 0 ? (
        <p className="small muted" style={{ margin: '12px 0 4px' }}>No conversations yet.</p>
      ) : (
        <div className="list">
          {conversations.map((c) => {
            const last = c.messages[c.messages.length - 1];
            return (
              <button
                key={c.id}
                type="button"
                role="menuitem"
                className="notif-item"
                onClick={() => { markConversationRead(c.id); setOpenId(c.id); }}
              >
                <TenantAvatar name={c.name} />
                <span style={{ flex: 1 }}>
                  <strong>{c.name}</strong>
                  <span className="small muted" style={{ display: 'block' }}>{c.context}</span>
                  <span className="small muted" style={{ display: 'block' }}>{last ? `${last.from === 'me' ? 'You: ' : ''}${last.text}` : ''}</span>
                </span>
                {c.unread > 0 ? <span className="badge danger">{c.unread}</span> : null}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
