import { useEffect, useState } from "react";
import { Icon } from "@/components/Icons";

type InstallPromptEvent = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: "accepted" | "dismissed" }> };

export function PwaInstall({ compact = false }: { compact?: boolean }) {
  const [prompt, setPrompt] = useState<InstallPromptEvent | null>(null);
  const [dismissed, setDismissed] = useState(false);
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    function onPrompt(event: Event) {
      event.preventDefault();
      setPrompt(event as InstallPromptEvent);
    }
    function onInstalled() { setInstalled(true); setPrompt(null); }
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    if (window.matchMedia("(display-mode: standalone)").matches) setInstalled(true);
    try { if (localStorage.getItem("toolora:install-dismissed") === "1") setDismissed(true); } catch { /* ignore */ }
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  if (installed || dismissed || !prompt) return null;

  return (
    <div className={compact ? "inline-flex items-center gap-1.5" : "flex flex-wrap items-center gap-2 rounded-xl border border-brand-400/20 bg-brand-400/[0.05] px-3 py-2"}>
      <button
        type="button"
        onClick={() => { void prompt.prompt(); void prompt.userChoice.then(() => setPrompt(null)); }}
        className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-brand-200 hover:text-brand-100"
      >
        <Icon name="download" size={12} />
        Install Toolsy
      </button>
      <button
        type="button"
        aria-label="Dismiss install suggestion"
        onClick={() => { setDismissed(true); try { localStorage.setItem("toolora:install-dismissed", "1"); } catch { /* ignore */ } }}
        className="rounded p-0.5 text-mist-500 hover:text-mist-200"
      >
        <Icon name="close" size={11} />
      </button>
    </div>
  );
}
