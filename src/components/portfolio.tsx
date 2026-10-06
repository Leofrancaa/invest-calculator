"use client";

import { useEffect, useState } from "react";
import { Check, Save, Wallet } from "lucide-react";
import { NumericField } from "./numeric-field";
import { currency, percent } from "@/lib/calculations";
import {
  assetClasses,
  emptyPortfolio,
  PORTFOLIO_STORAGE_KEY,
  restorePortfolio,
  summarizePortfolio,
} from "@/lib/portfolio";

export function Portfolio() {
  const [values, setValues] = useState(emptyPortfolio);
  const [loaded, setLoaded] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [status, setStatus] = useState("");
  const [storageError, setStorageError] = useState(false);
  useEffect(() => {
    const timer = window.setTimeout(() => {
      try {
        const raw = localStorage.getItem(PORTFOLIO_STORAGE_KEY);
        if (raw) setValues(restorePortfolio(raw));
      } catch {
        setStorageError(true);
        setStatus(
          "Não foi possível carregar a carteira. Os dados anteriores não foram alterados.",
        );
      }
      setLoaded(true);
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);
  const summary = summarizePortfolio(values);
  function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!loaded || !summary || storageError) return;
    try {
      localStorage.setItem(
        PORTFOLIO_STORAGE_KEY,
        JSON.stringify({ version: 1, values }),
      );
      setDirty(false);
      setStatus("Carteira salva neste navegador.");
    } catch {
      setStatus(
        "Não foi possível salvar neste navegador. Os valores continuam disponíveis nesta sessão.",
      );
    }
  }
  return (
    <div className="calculator-grid portfolio-grid">
      <section className="input-panel" aria-labelledby="portfolio-input-title">
        <div className="panel-heading">
          <h2 id="portfolio-input-title">Valores da sua carteira</h2>
          <span className="subtle-tag">Em reais</span>
        </div>
        <p className="panel-description">
          Informe o valor atual de cada categoria. Deixe em branco o que você
          não possui.
        </p>
        <form noValidate onSubmit={save}>
          <div className="portfolio-fields">
            {assetClasses.map((category) => (
              <NumericField
                key={category.id}
                id={`portfolio-${category.id}`}
                label={category.label}
                value={values[category.id]}
                onChange={(value) => {
                  setValues((previous) => ({
                    ...previous,
                    [category.id]: value,
                  }));
                  setDirty(true);
                  if (!storageError) setStatus("");
                }}
                hint={category.hint}
                min={0}
                max={1e12}
              />
            ))}
          </div>
          <div className="portfolio-save-row">
            <button
              type="submit"
              className="button primary"
              disabled={!loaded || !summary || storageError}
            >
              <Save size={16} /> Salvar carteira
            </button>
            <span>
              {dirty ? (
                "Alterações não salvas"
              ) : (
                <>
                  <Check size={14} />{" "}
                  {loaded ? "Pronto para editar" : "Carregando…"}
                </>
              )}
            </span>
          </div>
          <p role="status" className="portfolio-status">
            {status}
          </p>
          {!summary && (
            <p className="field-error" role="alert">
              Corrija os valores inválidos para calcular e salvar sua carteira.
            </p>
          )}
        </form>
      </section>
      <section
        className="results-panel"
        aria-labelledby="portfolio-summary-title"
      >
        <div className="panel-heading">
          <h2 id="portfolio-summary-title">Distribuição atual</h2>
          <Wallet size={18} />
        </div>
        <div className="portfolio-total">
          <span>Valor total da carteira</span>
          <strong>{currency(summary?.total ?? null)}</strong>
          <p>
            {summary
              ? `${summary.activeCategories} ${summary.activeCategories === 1 ? "categoria com saldo" : "categorias com saldo"}`
              : "Aguardando valores válidos"}
          </p>
        </div>
        {summary && summary.total > 0 ? (
          <div className="portfolio-allocation">
            {summary.allocation
              .filter((category) => category.amount > 0)
              .sort((a, b) => b.amount - a.amount)
              .map((category) => (
                <div className="allocation-row" key={category.id}>
                  <div>
                    <span>{category.label}</span>
                    <strong>{percent(category.percentage)}</strong>
                  </div>
                  <div className="allocation-track" aria-hidden="true">
                    <span style={{ width: `${category.percentage}%` }} />
                  </div>
                  <p>{currency(category.amount)}</p>
                </div>
              ))}
          </div>
        ) : (
          <div className="portfolio-empty">
            <p>
              {summary
                ? "Sua carteira ainda está vazia. Informe os valores ao lado para ver a distribuição."
                : "A distribuição aparecerá quando todos os valores forem válidos."}
            </p>
          </div>
        )}
        <p className="note">
          Os percentuais mostram sua composição atual. Não representam uma
          recomendação de alocação.
        </p>
        <div id="portfolio-guide" className="portfolio-guide">
          <h3>Como preencher</h3>
          <p>
            Use o valor atual, não o total que você já aportou. Registre cada
            investimento em uma única categoria para evitar duplicidade.
            Converta investimentos em outras moedas para reais antes de
            preencher.
          </p>
          <p>
            Os dados ficam apenas neste navegador. Clique em Salvar carteira
            para mantê-los após fechar a página.
          </p>
        </div>
      </section>
    </div>
  );
}
