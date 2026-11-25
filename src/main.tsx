import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App";

const canRegisterServiceWorker =
  typeof window !== "undefined" &&
  window.location.protocol !== "file:" &&
  "serviceWorker" in navigator;

if (canRegisterServiceWorker && import.meta.env.PROD) {
  window.addEventListener("load", () => {
    void navigator.serviceWorker.register(`${window.location.origin}/sw.js`).catch(() => undefined);
  });
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
