import { useEffect, useRef, useState } from "react";
import { sendMessage, useMessages } from "../lib/data";
import type { Thread } from "../lib/types";

export default function ChatView({ threadId, me, thread, onBack }: { threadId: string; me: string; thread?: Thread; onBack: () => void }) {
  const messages = useMessages(threadId);
  const [text, setText] = useState("");
  const [err, setErr] = useState("");
  const end = useRef<HTMLDivElement>(null);
  const other = thread?.participants.find((p) => p !== me) ?? "";
  useEffect(() => end.current?.scrollIntoView({ behavior: "smooth" }), [messages.length]);

  return (
    <section className="chat">
      <div className="chat-head">
        <button className="link" onClick={onBack}>← Chats</button>
        <b>{thread?.names?.[other] ?? "Chat"}</b>
      </div>
      <p className="notice small">Share your phone number only when you're ready. Always meet at the hospital or blood bank, never at home. Red.Dot never asks for payment. Selling blood is illegal in India.</p>
      <div className="msgs">
        {messages.map((m) => (
          <div key={m.id} className={`msg ${m.senderId === me ? "me" : ""}`}>
            <span>{m.text}</span>
            <time>{m.createdAt?.toDate?.().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) ?? "…"}</time>
          </div>
        ))}
        <div ref={end} />
      </div>
      <form className="composer" onSubmit={async (e) => {
        e.preventDefault();
        const t = text; setText(""); setErr("");
        try { await sendMessage(threadId, me, t); } catch (x) { setText(t); setErr((x as Error).message); }
      }}>
        <input value={text} onChange={(e) => setText(e.target.value)} placeholder="Type a message…" maxLength={1000} aria-label="Message" />
        <button className="btn primary" disabled={!text.trim()}>Send</button>
      </form>
      {err && <p className="error small">{err}</p>}
    </section>
  );
}
