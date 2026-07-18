"use client";

import { useState } from "react";
import type Anthropic from "@anthropic-ai/sdk";

// mirror of the server's ChatEvent — worth centralizing in packages/schema later
type ChatEvent =
    | { type: "delta"; text: string }
    | { type: "status"; tool: string; input: unknown }
    | { type: "done"; messages: Anthropic.MessageParam[] }
    | { type: "error"; message: string };

export default function Home() {
    // canonical state: only ever set from the server's `done` event
    const [messages, setMessages] = useState<Anthropic.MessageParam[]>([]);

    // provisional state: exists only while a response is in flight
    const [streamText, setStreamText] = useState("");
    const [statusLine, setStatusLine] = useState("");

    const [input, setInput] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    async function send(e: React.FormEvent) {
        e.preventDefault();
        if (!input.trim() || loading) return;

        // build the new history locally: state updates are async, so we can't
        // setMessages and then read `messages` for the fetch body
        const next: Anthropic.MessageParam[] = [
            ...messages,
            { role: "user", content: input },
        ];
        setMessages(next);
        setInput("");
        setLoading(true);
        setError("");

        try {
            const res = await fetch("/api/chat", {
                method: "POST",
                headers: { "content-type": "application/json" },
                body: JSON.stringify({ messages: next }),
            });
            if (!res.ok || !res.body) {
                throw new Error(`request failed (${res.status})`);
            }

            const reader = res.body.getReader();
            const decoder = new TextDecoder();
            let buffer = "";

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                buffer += decoder.decode(value, { stream: true });

                // split buffer on "\n\n"; each complete chunk is one SSE event
                let i;
                while ((i = buffer.indexOf("\n\n")) >= 0) {
                    const chunk = buffer.slice(0, i);
                    buffer = buffer.slice(i + 2);
                    if (!chunk.startsWith("data: ")) continue;

                    let event: ChatEvent;
                    try {
                        event = JSON.parse(chunk.slice(6));
                    } catch {
                        continue; // malformed frame — skip it, don't kill the stream
                    }

                    if (event.type === "delta") {
                        setStatusLine("");
                        setStreamText((prev) => prev + event.text);
                    } else if (event.type === "status") {
                        setStatusLine(`consulting ${event.tool}…`);
                    } else if (event.type === "done") {
                        console.log("canonical history:", event.messages);
                        setMessages(event.messages);
                        return;
                    } else if (event.type === "error") {
                        throw new Error(event.message);
                    }
                }
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : "something went wrong");
        } finally {
            // provisional state never outlives the request
            setStreamText("");
            setStatusLine("");
            setLoading(false);
        }
    }

    return (
        <main style={{ maxWidth: 640, margin: "0 auto", padding: 16 }}>
            <h1>ask riley</h1>

            {messages.map((msg, i) => {
                // only render the role if we're going to show text blocks
                if (typeof msg.content === "string") {
                    return (
                        <div key={i} style={{ margin: "12px 0" }}>
                            <b>{msg.role}:</b>{" "}
                            {msg.content}
                        </div>
                    );
                }

                const textBlocks = Array.isArray(msg.content)
                    ? msg.content.filter((block) => block.type === "text")
                    : [];

                if (textBlocks.length === 0) return null;

                return (
                    <div key={i} style={{ margin: "12px 0" }}>
                        <b>{msg.role}:</b>{" "}
                        {textBlocks.map((block, j) => (
                            <span key={j}>{block.text}</span>
                        ))}
                    </div>
                );
            })}

            {streamText && (
                <div style={{ margin: "12px 0" }}>
                    <b>assistant:</b> <span>{streamText}</span>
                </div>
            )}

            {loading && <div>{statusLine || "thinking…"}</div>}

            {error && <div style={{ color: "crimson" }}>error: {error}</div>}

            <form onSubmit={send}>
                <input
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="ask me about Riley"
                    style={{ width: "80%" }}
                />
                <button disabled={loading}>send</button>
            </form>
        </main>
    );
}
