import { useState, type FormEvent } from "react";
import { Loader2, Send } from "lucide-react";

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

const API_URL = "http://localhost:8000";

export default function BloodBridgeAgent() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [toolsUsed, setToolsUsed] = useState<string[]>([]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const message = input.trim();

    if (!message || busy) return;

    const history = messages.slice(-12);

    setMessages((previous) => [
      ...previous,
      { role: "user", content: message },
    ]);

    setInput("");
    setBusy(true);
    setError("");
    setToolsUsed([]);

    try {
      const response = await fetch(`${API_URL}/api/agent/chat`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message,
          history,
        }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          response.status === 401
            ? "Your session has expired. Please log in again."
            : typeof data.detail === "string"
              ? data.detail
              : "Unable to contact the assistant.",
        );
      }

      setMessages((previous) => [
        ...previous,
        {
          role: "assistant",
          content: data.reply,
        },
      ]);

      setToolsUsed(data.tools_used || []);
    } catch (caught) {
      // Restore the unsent conversational turn for a retry.
      setMessages((previous) => previous.slice(0, -1));
      setInput(message);

      setError(
        caught instanceof Error
          ? caught.message
          : "Could not connect to the backend.",
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <section
      aria-labelledby="agent-heading"
      className="card-surface overflow-hidden"
    >
      <div className="border-b border-border p-5">
        <h2 id="agent-heading" className="text-xl font-bold">
          BloodBridge AI Assistant
        </h2>

        <p className="mt-2 text-sm text-muted-foreground">
          Search recorded inventory or check your requests.
          Clinical suitability must be confirmed by qualified staff.
        </p>
      </div>

      <div
        role="log"
        aria-label="Conversation"
        aria-live="polite"
        aria-busy={busy}
        className="flex h-96 flex-col gap-4 overflow-y-auto p-5"
      >
        {messages.length === 0 && (
          <p className="text-sm text-muted-foreground">
            Try: “Find 2 units of A+ red cells in Nashik.”
          </p>
        )}

        {messages.map((message, index) => (
          <div
            key={index}
            className={`max-w-[90%] whitespace-pre-wrap break-words rounded-2xl px-4 py-3 text-sm ${
              message.role === "user"
                ? "self-end bg-primary text-primary-foreground"
                : "self-start bg-secondary text-secondary-foreground"
            }`}
          >
            <p className="mb-1 text-xs font-semibold">
              {message.role === "user" ? "You" : "BloodBridge"}
            </p>

            {message.content}
          </div>
        ))}

        {busy && (
          <p className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2
              className="h-4 w-4 animate-spin"
              aria-hidden="true"
            />
            Processing your request...
          </p>
        )}
      </div>

      {toolsUsed.length > 0 && (
        <p className="px-5 pb-3 text-xs text-muted-foreground">
          Tools executed: {toolsUsed.join(", ")}
        </p>
      )}

      {error && (
        <p role="alert" className="px-5 pb-3 text-sm text-red-600">
          {error}
        </p>
      )}

      <form
        onSubmit={handleSubmit}
        className="flex gap-3 border-t border-border p-4"
      >
        <label htmlFor="agent-message" className="sr-only">
          Message the BloodBridge assistant
        </label>

        <input
          id="agent-message"
          value={input}
          onChange={(event) => setInput(event.target.value)}
          placeholder="Ask about inventory or your requests..."
          maxLength={2000}
          disabled={busy}
          className="min-w-0 flex-1 rounded-xl border border-border bg-background px-4 py-3 outline-none focus:ring-2 focus:ring-primary/20"
        />

        <button
          type="submit"
          disabled={busy || !input.trim()}
          aria-label="Send message"
          className="btn btn-primary disabled:opacity-60"
        >
          {busy ? (
            <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />
          ) : (
            <Send className="h-5 w-5" aria-hidden="true" />
          )}
        </button>
      </form>
    </section>
  );
}