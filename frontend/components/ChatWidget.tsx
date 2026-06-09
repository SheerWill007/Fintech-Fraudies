import { MessageCircle } from "lucide-react";

export function ChatWidget() {
  return (
    <button
      type="button"
      aria-label="Open chat"
      className="fixed bottom-6 right-6 z-50 flex h-12 w-12 items-center justify-center rounded-full border border-white/10 bg-zinc-900 text-white shadow-lg transition-colors hover:bg-zinc-800"
    >
      <MessageCircle className="h-5 w-5" />
    </button>
  );
}
