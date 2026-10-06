"use client";

import { useEffect, useState } from "react";
import { Download } from "lucide-react";

type InstallEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

export function PwaSupport() {
  const [installEvent, setInstallEvent] = useState<InstallEvent | null>(null);
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState("");
  useEffect(() => {
    const offerInstall = (event: Event) => {
      event.preventDefault();
      setInstallEvent(event as InstallEvent);
    };
    const installed = () => {
      setInstallEvent(null);
      setMessage("Aplicativo instalado. Você pode abri-lo pela tela inicial.");
    };
    window.addEventListener("beforeinstallprompt", offerInstall);
    window.addEventListener("appinstalled", installed);
    if ("serviceWorker" in navigator)
      navigator.serviceWorker
        .register("/sw.js", { scope: "/", updateViaCache: "none" })
        .catch(() =>
          setMessage(
            "Não foi possível preparar a instalação. Recarregue a página para tentar novamente.",
          ),
        );
    return () => {
      window.removeEventListener("beforeinstallprompt", offerInstall);
      window.removeEventListener("appinstalled", installed);
    };
  }, []);
  async function install() {
    if (!installEvent || pending) return;
    setPending(true);
    try {
      await installEvent.prompt();
      const choice = await installEvent.userChoice;
      setInstallEvent(null);
      setMessage(
        choice.outcome === "accepted"
          ? "Instalação solicitada. Confira a tela inicial do celular."
          : "Você pode instalar depois pelo menu do navegador.",
      );
    } catch {
      setMessage(
        "Não foi possível iniciar a instalação. Use o menu do navegador para adicionar à tela inicial.",
      );
    } finally {
      setPending(false);
    }
  }
  return (
    <details className="pwa-install-help">
      <summary>
        <span>
          <Download size={16} /> Instalar no celular
        </span>
      </summary>
      <div>
        {installEvent && (
          <button
            type="button"
            className="button primary"
            disabled={pending}
            onClick={install}
          >
            {pending ? "Preparando…" : "Instalar aplicativo"}
          </button>
        )}
        <p>
          <strong>Android:</strong> no Chrome, abra o menu e escolha “Instalar
          aplicativo” ou “Adicionar à tela inicial”.
        </p>
        <p>
          <strong>iPhone:</strong> no Safari, toque em Compartilhar e depois em
          “Adicionar à Tela de Início”.
        </p>
        <p>
          A instalação mantém o login de administrador. É necessário estar
          online para entrar ou reabrir o aplicativo.
        </p>
        <p role="status">{message}</p>
      </div>
    </details>
  );
}
