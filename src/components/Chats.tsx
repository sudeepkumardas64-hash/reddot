import { timeAgo } from "../lib/blood";
import type { Thread } from "../lib/types";

export default function Chats({ threads, me, onOpen }: { threads: Thread[]; me: string; onOpen: (id: string) => void }) {
  return (
    <section>
      <div className="section-head"><h1>Chats</h1></div>
      {threads.length === 0 && <div className="empty"><p>No conversations yet. Tap <b>I can help</b> on a request or message a donor to start one.</p></div>}
      <ul className="list">
        {threads.map((t) => {
          const other = t.participants.find((p) => p !== me) ?? "";
          return (
            <li key={t.id}>
              <button className="list-item" onClick={() => onOpen(t.id)}>
                <span className="avatar">{(t.names?.[other] ?? "?").slice(0, 1).toUpperCase()}</span>
                <span className="grow">
                  <b>{t.names?.[other] ?? "User"}</b>
                  <span className="muted small ellipsis">{t.lastMessage || "No messages yet"}</span>
                </span>
                <span className="muted small">{timeAgo(t.updatedAt?.toDate?.())}</span>
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
