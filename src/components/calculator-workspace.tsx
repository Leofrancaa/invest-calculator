"use client";

import Link from "next/link";
import { NumericField as Field } from "./numeric-field";
import { Portfolio } from "./portfolio";
import { signOut } from "@/app/login/actions";

import { useEffect, useState, type ReactNode } from "react";
import {
  ArrowDownToLine,
  ArrowRight,
  ArrowUpRight,
  BookmarkPlus,
  Check,
  ChevronRight,
  CircleHelp,
  ExternalLink,
  Landmark,
  LineChart,
  Plus,
  RotateCcw,
  ShieldCheck,
  SlidersHorizontal,
  TrendingUp,
  Wallet,
  X,
} from "lucide-react";
import {
  calculateAnnualDividends,
  calculateCompound,
  calculateIncome,
  calculateValuation,
  currency,
  parseAmount,
  percent,
} from "@/lib/calculations";

type Tool = "valuation" | "income" | "compound" | "portfolio";
type SavedScenario = {
  id: string;
  name: string;
  price: number;
  graham: number | null;
  bazin: number | null;
  margin: number;
  grahamEntry: number | null;
  bazinEntry: number | null;
};
const STORAGE_KEY = "invest-calculator:scenarios:v1";
const tools = [
  {
    id: "portfolio" as const,
    label: "Minha carteira",
    icon: Wallet,
    description: "Sua distribuição por categoria",
  },
  {
    id: "valuation" as const,
    label: "Avaliação de ações",
    icon: Landmark,
    description: "Graham & Bazin",
  },
  {
    id: "income" as const,
    label: "Renda com dividendos",
    icon: Wallet,
    description: "Planeje sua meta mensal",
  },
  {
    id: "compound" as const,
    label: "Juros compostos",
    icon: TrendingUp,
    description: "Simule o crescimento do patrimônio",
  },
];
const titles = {
  portfolio: [
    "Sua carteira, por categoria.",
    "Registre seus investimentos e acompanhe a distribuição do patrimônio.",
  ],
  valuation: [
    "Quanto vale a ação?",
    "Informe os indicadores e compare os preços estimados.",
  ],
  income: [
    "Planeje sua renda mensal.",
    "Calcule quanto investir para alcançar sua meta de dividendos.",
  ],
  compound: [
    "Veja seu patrimônio crescer.",
    "Simule o efeito dos aportes e do tempo nos seus investimentos.",
  ],
};

function DividendEstimator({
  price,
  onApply,
  idPrefix,
}: {
  price: string;
  onApply: (value: string) => void;
  idPrefix: string;
}) {
  const [dividendYield, setDividendYield] = useState("");
  const [status, setStatus] = useState("");
  const priceValue = valid(price, 0.000001);
  const yieldValue = valid(dividendYield, 0, 100);
  const estimate = calculateAnnualDividends(priceValue, yieldValue);
  return (
    <details className="dividend-estimator">
      <summary>
        Calcular proventos pelo Dividend Yield <Plus size={16} />
      </summary>
      <div>
        <p className="estimator-description">
          Use o DY dos últimos 12 meses e a cotação correspondente. O resultado
          é uma aproximação.
        </p>
        <Field
          id={`${idPrefix}-dividend-yield`}
          label="Dividend Yield atual (DY)"
          value={dividendYield}
          onChange={(value) => {
            setDividendYield(value);
            setStatus("");
          }}
          suffix="%"
          min={0}
          max={100}
          hint="Informe o percentual, por exemplo: 6,4."
        />
        <div className="estimator-result">
          <span>Proventos anuais estimados por ação</span>
          <strong>
            {estimate === null
              ? "—"
              : `R$ ${estimate.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 6 })}`}
          </strong>
          <p>
            {priceValue === null
              ? "Preencha um preço atual válido no campo acima."
              : yieldValue === null
                ? "Informe um DY válido para calcular."
                : `${currency(priceValue)} × ${yieldValue.toLocaleString("pt-BR", { maximumFractionDigits: 6 })} ÷ 100`}
          </p>
        </div>
        <button
          type="button"
          className="button secondary"
          disabled={estimate === null}
          onClick={() => {
            if (estimate === null) return;
            onApply(
              estimate.toLocaleString("pt-BR", {
                useGrouping: false,
                maximumFractionDigits: 10,
              }),
            );
            setStatus("Valor aplicado ao campo de proventos anuais.");
          }}
        >
          Usar valor nos proventos <ArrowRight size={15} />
        </button>
        <p className="estimator-status" role="status">
          {status}
        </p>
      </div>
    </details>
  );
}

function Metric({
  label,
  value,
  detail,
  accent = false,
}: {
  label: string;
  value: string;
  detail?: ReactNode;
  accent?: boolean;
}) {
  return (
    <div className={`metric ${accent ? "accent" : ""}`}>
      <span className="metric-label">{label}</span>
      <strong>{value}</strong>
      {detail && <div className="metric-detail">{detail}</div>}
    </div>
  );
}
function EmptyResult({ children }: { children: ReactNode }) {
  return (
    <div className="empty-result">
      <SlidersHorizontal size={30} strokeWidth={1.4} />
      <h3>Seus indicadores, sua análise.</h3>
      <p>{children}</p>
    </div>
  );
}
function Note({ children }: { children: ReactNode }) {
  return (
    <p className="note">
      <CircleHelp size={16} />
      <span>{children}</span>
    </p>
  );
}
function valid(value: string, min = 0, max = 1e9, integer = false) {
  const number = parseAmount(value);
  return number !== null &&
    number >= min &&
    number <= max &&
    (!integer || Number.isInteger(number))
    ? number
    : null;
}

export function CalculatorWorkspace() {
  const [tool, setTool] = useState<Tool>("valuation");
  const [saved, setSaved] = useState<SavedScenario[]>([]);
  const [status, setStatus] = useState("");
  const [loaded, setLoaded] = useState(false);
  useEffect(() => {
    const timer = window.setTimeout(() => {
      try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) {
          const entries: unknown = JSON.parse(raw);
          if (!Array.isArray(entries))
            throw new Error("Invalid saved scenarios");
          const isNullableNumber = (value: unknown) =>
            value === null ||
            (typeof value === "number" && Number.isFinite(value) && value >= 0);
          const restored = entries.filter(
            (entry): entry is SavedScenario =>
              entry &&
              typeof entry === "object" &&
              typeof entry.id === "string" &&
              typeof entry.name === "string" &&
              typeof entry.price === "number" &&
              Number.isFinite(entry.price) &&
              entry.price > 0 &&
              typeof entry.margin === "number" &&
              entry.margin >= 0 &&
              entry.margin <= 80 &&
              [
                entry.graham,
                entry.bazin,
                entry.grahamEntry,
                entry.bazinEntry,
              ].every(isNullableNumber),
          );
          setSaved(restored.slice(0, 12));
        }
      } catch {
        setStatus(
          "Não foi possível ler os cenários salvos. As calculadoras continuam disponíveis.",
        );
      }
      setLoaded(true);
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);
  function persist(next: SavedScenario[], message: string) {
    setSaved(next);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      setStatus(message);
    } catch {
      setStatus(
        "Atualizado nesta sessão. O armazenamento do navegador está indisponível; exporte um CSV para guardar seus cenários.",
      );
    }
  }
  function save(entry: Omit<SavedScenario, "id">) {
    if (saved.length >= 12) {
      setStatus("Você já tem 12 cenários. Remova um antes de salvar outro.");
      return;
    }
    persist(
      [...saved, { ...entry, id: crypto.randomUUID() }],
      "Cenário salvo neste dispositivo.",
    );
  }
  function exportCsv() {
    const cell = (value: unknown) => {
      const text = String(value ?? "");
      const safe =
        typeof value === "string" && /^[=+@\-\t\r]/.test(text)
          ? `'${text}`
          : text;
      return `"${safe.replace(/"/g, '""')}"`;
    };
    const rows = [
      [
        "Cenário",
        "Preço em BRL",
        "Graham em BRL",
        "Bazin em BRL",
        "Margem de segurança %",
        "Entrada Graham em BRL",
        "Entrada Bazin em BRL",
      ],
      ...saved.map((entry) => [
        entry.name,
        entry.price,
        entry.graham,
        entry.bazin,
        entry.margin,
        entry.grahamEntry,
        entry.bazinEntry,
      ]),
    ];
    const url = URL.createObjectURL(
      new Blob(
        ["\uFEFF" + rows.map((row) => row.map(cell).join(",")).join("\r\n")],
        { type: "text/csv;charset=utf-8;" },
      ),
    );
    const link = document.createElement("a");
    link.href = url;
    link.download = "investment-scenarios.csv";
    link.click();
    URL.revokeObjectURL(url);
    setStatus("Cenários exportados em CSV.");
  }
  return (
    <div className="app-shell">
      <a href="#main" className="skip-link">
        Ir para a calculadora
      </a>
      <header className="app-header">
        <Link
          href="/"
          className="brand"
          aria-label="Página inicial do Invest Calculator"
        >
          <span className="brand-symbol">
            <LineChart size={21} />
          </span>
          <span>
            invest<span className="brand-light">calculator</span>
            <span className="brand-dot">.</span>
          </span>
        </Link>
        <div className="header-right">
          <form action={signOut} noValidate className="sign-out-form">
            <span className="admin-label">admin</span>
            <button type="submit" className="text-button">
              Sair
            </button>
          </form>
          <span className="privacy">
            <ShieldCheck size={15} /> Privacidade por padrão
          </span>
          <a
            href="https://investidor10.com.br/acoes/"
            target="_blank"
            rel="noopener noreferrer"
            className="external-link"
          >
            Abrir Investidor10 <ArrowUpRight size={16} />
            <span className="sr-only"> (abre em uma nova aba)</span>
          </a>
        </div>
      </header>
      <div className="workspace">
        <aside className="sidebar">
          <div>
            <p className="nav-title">Suas ferramentas</p>
            <nav aria-label="Calculadoras">
              {tools.map((item) => (
                <button
                  key={item.id}
                  onClick={() => setTool(item.id)}
                  aria-current={tool === item.id ? "page" : undefined}
                  className={`nav-item ${tool === item.id ? "selected" : ""}`}
                >
                  <item.icon size={19} />
                  <span>
                    {item.label}
                    <small>{item.description}</small>
                  </span>
                  {tool === item.id && (
                    <ChevronRight size={15} className="nav-arrow" />
                  )}
                </button>
              ))}
            </nav>
          </div>
          <div className="sidebar-bottom">
            <div className="companion-mark">
              <Plus size={18} />
            </div>
            <h3>Mais uma perspectiva.</h3>
            <p>
              Use os indicadores que você já acompanha e ajuste suas próprias
              premissas.
            </p>
            <a href={tool === "portfolio" ? "#portfolio-guide" : "#methods"}>
              {tool === "portfolio"
                ? "Como preencher a carteira"
                : "Entenda as fórmulas"}{" "}
              <ArrowRight size={14} />
            </a>
          </div>
        </aside>
        <main id="main">
          <div className="page-heading">
            <div>
              <h1>{titles[tool][0]}</h1>
              <p>{titles[tool][1]}</p>
            </div>
            <span className="manual-badge">
              <span /> Dados manuais · BRL
            </span>
          </div>
          <div className="tool-container" hidden={tool !== "portfolio"}>
            <Portfolio />
          </div>
          <div
            className="tool-container"
            key={tool}
            hidden={tool === "portfolio"}
          >
            {tool === "valuation" ? (
              <Valuation onSave={save} canSave={loaded && saved.length < 12} />
            ) : tool === "income" ? (
              <Income />
            ) : tool === "compound" ? (
              <Compound />
            ) : null}
          </div>
          {tool === "valuation" && (
            <section className="saved-section" aria-labelledby="saved-title">
              <div className="section-heading">
                <div>
                  <h2 id="saved-title">
                    Seus cenários{" "}
                    <span>{saved.length.toString().padStart(2, "0")}</span>
                  </h2>
                  <p>
                    Compare suas premissas. Os cenários ficam salvos apenas
                    neste navegador.
                  </p>
                </div>
                <button
                  className="button secondary small"
                  onClick={exportCsv}
                  disabled={!saved.length}
                >
                  <ArrowDownToLine size={15} /> Exportar CSV
                </button>
              </div>
              {saved.length ? (
                <div
                  className="table-scroll"
                  tabIndex={0}
                  role="region"
                  aria-label="Tabela de cenários salvos"
                >
                  <table>
                    <caption className="sr-only">
                      Cenários salvos de avaliação de ações
                    </caption>
                    <thead>
                      <tr>
                        <th>Cenário</th>
                        <th>Preço atual</th>
                        <th>Graham</th>
                        <th>Bazin</th>
                        <th>Margem de segurança</th>
                        <th>Entrada Graham</th>
                        <th>Entrada Bazin</th>
                        <th>
                          <span className="sr-only">Ações</span>
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {saved.map((entry) => (
                        <tr key={entry.id}>
                          <th scope="row">{entry.name}</th>
                          <td>{currency(entry.price)}</td>
                          <td>{currency(entry.graham)}</td>
                          <td>{currency(entry.bazin)}</td>
                          <td>{percent(entry.margin)}</td>
                          <td>{currency(entry.grahamEntry)}</td>
                          <td>{currency(entry.bazinEntry)}</td>
                          <td>
                            <button
                              className="icon-button"
                              aria-label={`Remover ${entry.name}`}
                              onClick={() =>
                                persist(
                                  saved.filter((item) => item.id !== entry.id),
                                  `${entry.name} removido. Exporte os cenários antes de removê-los se precisar de uma cópia permanente.`,
                                )
                              }
                            >
                              <X size={15} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="shelf-empty">
                  <BookmarkPlus size={21} />
                  <p>
                    Salve seu primeiro cenário para comparar.
                    <span>Preencha os dados da ação acima e salve aqui.</span>
                  </p>
                </div>
              )}
            </section>
          )}
          <div role="status" className="status-message">
            {status}
          </div>
          <footer className="footer">
            <span>Ferramenta independente. Sem assinatura.</span>
            <span>Os cálculos são feitos no seu dispositivo.</span>
          </footer>
        </main>
      </div>
    </div>
  );
}

function Valuation({
  onSave,
  canSave,
}: {
  onSave: (entry: Omit<SavedScenario, "id">) => void;
  canSave: boolean;
}) {
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [eps, setEps] = useState("");
  const [bvps, setBvps] = useState("");
  const [dividend, setDividend] = useState("");
  const [targetYield, setTargetYield] = useState("6");
  const [margin, setMargin] = useState(25);
  const [example, setExample] = useState(false);
  const priceValue = valid(price, 0.000001);
  const epsValue = valid(eps, -1e9);
  const bvpsValue = valid(bvps, -1e9);
  const dividendValue = valid(dividend);
  const yieldValue = valid(targetYield, 0.01, 100);
  const grahamReady =
    epsValue !== null && bvpsValue !== null && epsValue > 0 && bvpsValue > 0;
  const bazinReady = dividendValue !== null && yieldValue !== null;
  const result =
    priceValue !== null && (grahamReady || bazinReady)
      ? calculateValuation({
          price: priceValue,
          eps: epsValue,
          bvps: bvpsValue,
          dividend: dividendValue,
          targetYield: yieldValue ?? 6,
          margin,
        })
      : null;
  const safeBazin = bazinReady ? (result?.bazin ?? null) : null;
  const safeBazinEntry = bazinReady ? (result?.bazinEntry ?? null) : null;
  function loadExample() {
    setName("EXEMPLO");
    setPrice("25");
    setEps("3");
    setBvps("20");
    setDividend("1,80");
    setTargetYield("6");
    setMargin(25);
    setExample(true);
  }
  function reset() {
    setName("");
    setPrice("");
    setEps("");
    setBvps("");
    setDividend("");
    setTargetYield("6");
    setMargin(25);
    setExample(false);
  }
  return (
    <>
      <div className="calculator-grid">
        <section className="input-panel" aria-labelledby="asset-title">
          <div className="panel-heading">
            <h2 id="asset-title">Indicadores da ação</h2>
            <button className="text-button" onClick={loadExample}>
              Carregar exemplo <ArrowUpRight size={13} />
            </button>
          </div>
          <p className="panel-description">
            Copie os dados da página de indicadores da ação.
          </p>
          {example && (
            <p className="example-notice">
              Valores ilustrativos. Não representam uma cotação atual.
            </p>
          )}
          <form noValidate onSubmit={(event) => event.preventDefault()}>
            <div className="field">
              <label htmlFor="asset-name">
                Ação ou cenário<span>opcional</span>
              </label>
              <div className="input-wrap">
                <input
                  id="asset-name"
                  autoComplete="off"
                  maxLength={40}
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder="Ex.: BBAS3 · conservador"
                />
              </div>
              <p className="field-help">Nome para identificar seu cenário.</p>
            </div>
            <Field
              id="price"
              label="Preço atual da ação"
              value={price}
              onChange={setPrice}
              hint="Cotação usada para comparar os resultados."
              min={0.000001}
              required
            />
            <div className="field-pair">
              <Field
                id="eps"
                label="Lucro por ação"
                value={eps}
                onChange={setEps}
                min={-1e9}
                hint="LPA · últimos 12 meses"
                optional
              />
              <Field
                id="bvps"
                label="Patrimônio por ação"
                value={bvps}
                onChange={setBvps}
                min={-1e9}
                hint="VPA · balanço mais recente"
                optional
              />
            </div>
            <div className="field-pair">
              <Field
                id="dividend"
                label="Proventos anuais por ação"
                value={dividend}
                onChange={setDividend}
                hint="Proventos por ação · últimos 12 meses"
                optional
              />
              <Field
                id="target-yield"
                label="Rentabilidade desejada"
                value={targetYield}
                onChange={setTargetYield}
                suffix="%"
                min={0.01}
                max={100}
                hint="Referência de Bazin: 6% ao ano"
              />
            </div>
            <DividendEstimator
              price={price}
              onApply={setDividend}
              idPrefix="valuation"
            />
            <div className="margin-control">
              <div>
                <label htmlFor="safety-margin">Margem de segurança</label>
                <output htmlFor="safety-margin">{margin}%</output>
              </div>
              <input
                id="safety-margin"
                type="range"
                min="0"
                max="80"
                step="5"
                value={margin}
                onChange={(event) => setMargin(Number(event.target.value))}
              />
              <p>Desconto aplicado ao preço estimado por cada método.</p>
            </div>
            <div className="input-actions">
              <span>
                <Check size={14} /> Atualização automática
              </span>
              <button className="text-button" onClick={reset} type="button">
                <RotateCcw size={13} /> Limpar
              </button>
            </div>
          </form>
        </section>
        <section className="results-panel" aria-labelledby="results-title">
          <div className="panel-heading">
            <h2 id="results-title">Resultados da avaliação</h2>
            <span className="subtle-tag">Dois métodos</span>
          </div>
          {result ? (
            <>
              <div className="valuation-results">
                <Metric
                  label="Preço justo de Graham"
                  value={currency(result.graham)}
                  detail={
                    result.grahamUpside !== null ? (
                      <span
                        className={
                          result.grahamUpside >= 0 ? "positive" : "negative"
                        }
                      >
                        {percent(result.grahamUpside)} em relação ao preço atual
                      </span>
                    ) : (
                      "Exige LPA e VPA positivos"
                    )
                  }
                />
                <Metric
                  label="Preço-teto de Bazin"
                  value={currency(safeBazin)}
                  detail={
                    safeBazin !== null ? (
                      <span
                        className={
                          (result.bazinUpside ?? 0) >= 0
                            ? "positive"
                            : "negative"
                        }
                      >
                        {percent(result.bazinUpside)} em relação ao preço atual
                      </span>
                    ) : (
                      "Informe os proventos anuais e uma rentabilidade válida"
                    )
                  }
                />
              </div>
              <div className="entry-band">
                <div className="entry-heading">
                  <ShieldCheck size={18} />
                  <span>
                    Preços de entrada com {margin}% de margem de segurança
                  </span>
                </div>
                <div className="entry-values">
                  <div>
                    <span>Entrada Graham</span>
                    <strong>{currency(result.grahamEntry)}</strong>
                  </div>
                  <div>
                    <span>Entrada Bazin</span>
                    <strong>{currency(safeBazinEntry)}</strong>
                  </div>
                </div>
              </div>
              <div className="quick-metrics">
                <div>
                  <span>P/L</span>
                  <strong>
                    {result.pe === null
                      ? "—"
                      : `${result.pe.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}×`}
                  </strong>
                </div>
                <div>
                  <span>P/VP</span>
                  <strong>
                    {result.pb === null
                      ? "—"
                      : `${result.pb.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}×`}
                  </strong>
                </div>
                <div>
                  <span>Rentabilidade dos proventos</span>
                  <strong>{percent(result.currentYield)}</strong>
                </div>
              </div>
              <div className="scenario-heading">
                <h3>Compare as margens</h3>
                <span>Preço de entrada por desconto</span>
              </div>
              <div
                className="table-scroll"
                tabIndex={0}
                role="region"
                aria-label="Tabela de comparação das margens"
              >
                <table className="buffer-table">
                  <caption className="sr-only">
                    Preços de entrada com diferentes margens de segurança
                  </caption>
                  <thead>
                    <tr>
                      <th>Margem de segurança</th>
                      <th>Graham</th>
                      <th>Bazin</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[0, 10, 20, 30, 40].map((discount) => (
                      <tr key={discount}>
                        <th scope="row">{discount}%</th>
                        <td>
                          {currency(
                            result.graham === null
                              ? null
                              : result.graham * (1 - discount / 100),
                          )}
                        </td>
                        <td>
                          {currency(
                            safeBazin === null
                              ? null
                              : safeBazin * (1 - discount / 100),
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <button
                className="button primary save-button"
                disabled={!canSave}
                onClick={() =>
                  onSave({
                    name: name.trim() || "Cenário sem nome",
                    price: priceValue!,
                    graham: result.graham,
                    bazin: safeBazin,
                    margin,
                    grahamEntry: result.grahamEntry,
                    bazinEntry: safeBazinEntry,
                  })
                }
              >
                <BookmarkPlus size={17} /> Salvar cenário{" "}
                <ArrowRight size={16} />
              </button>
            </>
          ) : (
            <EmptyResult>
              Informe o preço da ação e o LPA + VPA ou os proventos anuais para
              calcular as estimativas. Você também pode carregar um exemplo.
            </EmptyResult>
          )}
          <Note>
            As estimativas usam os dados informados. Não garantem o valor real
            da empresa nem representam uma recomendação de compra.
          </Note>
        </section>
      </div>
      <section id="methods" className="methods-section">
        <h2>Entenda os cálculos.</h2>
        <div className="methods-grid">
          <details>
            <summary>
              Graham: lucro e patrimônio <Plus size={16} />
            </summary>
            <div>
              <code>√(22,5 × LPA × VPA)</code>
              <p>
                O número de Graham combina um P/L de 15 com um P/VP de 1,5. O
                lucro e o patrimônio por ação precisam ser positivos. O método
                pode ser menos adequado para empresas com poucos ativos ou
                lucros atípicos.
              </p>
              <a
                href="https://investidor10.com.br/conteudo/benjamin-graham/"
                target="_blank"
                rel="noopener noreferrer"
              >
                Referência do método <ExternalLink size={12} />
                <span className="sr-only"> (abre em uma nova aba)</span>
              </a>
            </div>
          </details>
          <details>
            <summary>
              Bazin: proventos e preço-teto <Plus size={16} />
            </summary>
            <div>
              <code>Proventos anuais por ação ÷ rentabilidade desejada</code>
              <p>
                Com rentabilidade desejada de 6%, R$ 1,80 de proventos anuais
                correspondem a um preço-teto de R$ 30,00. Este cálculo não
                inclui todos os critérios de seleção de empresas de Bazin.
                Pagamentos extraordinários podem elevar a estimativa.
              </p>
            </div>
          </details>
          <details>
            <summary>
              Margem de segurança e dados <Plus size={16} />
            </summary>
            <div>
              <code>Preço estimado × (1 − margem de segurança)</code>
              <p>
                A diferença percentual é calculada por preço estimado ÷ preço
                atual − 1. Use dados por ação ajustados à mesma base e a um
                período consistente. Informe os proventos em reais por ação, e
                não em percentual. Vírgula e ponto são aceitos como separadores
                decimais.
              </p>
            </div>
          </details>
        </div>
      </section>
    </>
  );
}

function Income() {
  const [example, setExample] = useState(false);
  const [price, setPrice] = useState("");
  const [dividend, setDividend] = useState("");
  const [goal, setGoal] = useState("1000");
  const [shares, setShares] = useState("0");
  const values = [
    valid(price, 0.000001),
    valid(dividend, 0.000001),
    valid(goal),
    valid(shares, 0, 1e9, true),
  ];
  const result = values.every((value) => value !== null)
    ? calculateIncome(values[0]!, values[1]!, values[2]!, values[3]!)
    : null;
  return (
    <>
      <div className="calculator-grid">
        <section className="input-panel">
          <div className="panel-heading">
            <h2>Dados para sua renda</h2>
            <button
              className="text-button"
              onClick={() => {
                setPrice("25");
                setDividend("1,80");
                setGoal("1000");
                setShares("100");
                setExample(true);
              }}
            >
              Carregar exemplo <ArrowUpRight size={13} />
            </button>
          </div>
          <p className="panel-description">
            Use os proventos anuais para estimar uma renda média mensal.
          </p>
          {example && (
            <p className="example-notice">
              Valores ilustrativos. Não representam uma cotação atual.
            </p>
          )}
          <form noValidate onSubmit={(event) => event.preventDefault()}>
            <Field
              id="income-price"
              label="Preço atual da ação"
              value={price}
              onChange={setPrice}
              min={0.000001}
              hint="Preço de compra usado na estimativa de capital."
            />
            <Field
              id="income-dividend"
              label="Proventos anuais por ação"
              value={dividend}
              onChange={setDividend}
              min={0.000001}
              hint="Total por ação durante um ano completo."
            />
            <DividendEstimator
              price={price}
              onApply={setDividend}
              idPrefix="income"
            />
            <Field
              id="income-goal"
              label="Meta de renda mensal"
              value={goal}
              onChange={setGoal}
              hint="Renda média que você deseja receber por mês."
            />
            <Field
              id="income-shares"
              label="Ações que você já possui"
              value={shares}
              onChange={setShares}
              suffix="ações"
              integer
              hint="Quantidade inteira · use 0 se estiver começando."
            />
          </form>
          <Note>
            Os proventos variam. A média mensal não significa que a ação paga
            todos os meses.
          </Note>
        </section>
        <section className="results-panel">
          <div className="panel-heading">
            <h2>Seu plano de renda</h2>
            <span className="subtle-tag">Base anual</span>
          </div>
          {result ? (
            <>
              <div className="valuation-results">
                <Metric
                  label="Ações necessárias para a meta"
                  value={result.requiredShares.toLocaleString("pt-BR")}
                  detail="Arredondado para a próxima ação inteira"
                />
                <Metric
                  label="Capital necessário estimado"
                  value={currency(result.requiredCapital)}
                  detail={`A ${currency(values[0])} por ação`}
                />
              </div>
              <div className="entry-band">
                <div className="entry-heading">
                  <Wallet size={18} />
                  <span>Renda das suas ações atuais</span>
                </div>
                <div className="entry-values">
                  <div>
                    <span>Média mensal</span>
                    <strong>{currency(result.monthlyAverage)}</strong>
                  </div>
                  <div>
                    <span>Renda anual</span>
                    <strong>{currency(result.annualIncome)}</strong>
                  </div>
                </div>
              </div>
              <div className="income-list">
                <div>
                  <span>Ações adicionais para alcançar a meta</span>
                  <strong>
                    {result.additionalShares.toLocaleString("pt-BR")}
                  </strong>
                </div>
                <div>
                  <span>Capital adicional</span>
                  <strong>
                    {currency(result.additionalShares * values[0]!)}
                  </strong>
                </div>
                <div>
                  <span>Rentabilidade dos proventos neste preço</span>
                  <strong>{percent(result.yield)}</strong>
                </div>
              </div>
            </>
          ) : (
            <EmptyResult>
              Informe um preço da ação e proventos anuais positivos para
              calcular quantas ações seriam necessárias para sua meta.
            </EmptyResult>
          )}
          <Note>
            Estimativas brutas, antes de impostos e taxas. Consideram proventos
            constantes, sem reinvestimento.
          </Note>
        </section>
      </div>
      <section id="methods" className="methods-section">
        <h2>Como a renda é calculada.</h2>
        <p className="method-inline">
          Ações necessárias = meta mensal × 12 ÷ proventos anuais por ação, com
          arredondamento para cima. Capital = ações necessárias × preço da ação.
        </p>
      </section>
    </>
  );
}

function Compound() {
  const [initial, setInitial] = useState("10000");
  const [monthly, setMonthly] = useState("500");
  const [rate, setRate] = useState("8");
  const [years, setYears] = useState("10");
  const [inflation, setInflation] = useState("4");
  const values = [
    valid(initial),
    valid(monthly),
    valid(rate, -99, 100),
    valid(years, 1, 60, true),
    valid(inflation, -99, 100),
  ];
  const result = values.every((value) => value !== null)
    ? calculateCompound(
        values[0]!,
        values[1]!,
        values[2]!,
        values[3]!,
        values[4]!,
      )
    : null;
  return (
    <>
      <div className="calculator-grid">
        <section className="input-panel">
          <div className="panel-heading">
            <h2>Dados da simulação</h2>
            <span className="subtle-tag">Simulação</span>
          </div>
          <p className="panel-description">
            Ajuste os valores para simular seu patrimônio futuro.
          </p>
          <form noValidate onSubmit={(event) => event.preventDefault()}>
            <Field
              id="initial"
              label="Investimento inicial"
              value={initial}
              onChange={setInitial}
              hint="Valor disponível no início da simulação."
            />
            <Field
              id="monthly"
              label="Aporte mensal"
              value={monthly}
              onChange={setMonthly}
              hint="Aplicado no fim de cada mês."
            />
            <div className="field-pair">
              <Field
                id="annual-rate"
                label="Rentabilidade anual"
                value={rate}
                onChange={setRate}
                min={-99}
                max={100}
                suffix="%"
                hint="Taxa efetiva ao ano"
              />
              <Field
                id="years"
                label="Prazo do investimento"
                value={years}
                onChange={setYears}
                min={1}
                max={60}
                integer
                suffix="anos"
                hint="Entre 1 e 60 anos"
              />
            </div>
            <Field
              id="inflation"
              label="Inflação anual"
              value={inflation}
              onChange={setInflation}
              min={-99}
              max={100}
              suffix="%"
              hint="Usada para estimar o poder de compra em reais de hoje."
            />
          </form>
          <Note>
            Premissas ilustrativas, não uma previsão. A rentabilidade é
            constante nesta simulação.
          </Note>
        </section>
        <section className="results-panel">
          <div className="panel-heading">
            <h2>Projeção do patrimônio</h2>
            <span className="subtle-tag">
              {valid(years, 1, 60, true) ?? "—"} anos
            </span>
          </div>
          {result ? (
            <>
              <div className="valuation-results">
                <Metric
                  label="Saldo projetado"
                  value={currency(result.total)}
                />
                <Metric
                  label="Poder de compra em reais de hoje"
                  value={currency(result.real)}
                />
              </div>
              <GrowthChart points={result.points} />
              <div className="quick-metrics growth-metrics">
                <div>
                  <span>Total de aportes</span>
                  <strong>{currency(result.invested)}</strong>
                </div>
                <div>
                  <span>Ganho ou perda no período</span>
                  <strong>{currency(result.earnings)}</strong>
                </div>
              </div>
              <details className="year-breakdown">
                <summary>
                  Ver a evolução ano a ano <Plus size={15} />
                </summary>
                <div
                  className="table-scroll"
                  tabIndex={0}
                  role="region"
                  aria-label="Tabela de projeção ano a ano"
                >
                  <table>
                    <thead>
                      <tr>
                        <th>Ano</th>
                        <th>Aportes</th>
                        <th>Saldo</th>
                        <th>Em reais de hoje</th>
                      </tr>
                    </thead>
                    <tbody>
                      {result.points.map((point) => (
                        <tr key={point.year}>
                          <th scope="row">{point.year}</th>
                          <td>{currency(point.invested)}</td>
                          <td>{currency(point.total)}</td>
                          <td>{currency(point.real)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </details>
            </>
          ) : (
            <EmptyResult>
              Informe valores válidos para ver a projeção. Use um prazo inteiro
              entre 1 e 60 anos.
            </EmptyResult>
          )}
          <Note>
            As taxas anuais efetivas são convertidas em taxas mensais. Os
            aportes permanecem fixos em reais nominais. Impostos e taxas não
            estão incluídos.
          </Note>
        </section>
      </div>
      <section id="methods" className="methods-section">
        <h2>Aportes constantes ao longo do tempo.</h2>
        <p className="method-inline">
          Taxa mensal = (1 + taxa anual)^(1/12) − 1. Cada aporte começa a render
          após o mês em que é aplicado. Saldo corrigido pela inflação = saldo
          nominal ÷ (1 + inflação)^anos.
        </p>
      </section>
    </>
  );
}

function GrowthChart({
  points,
}: {
  points: NonNullable<ReturnType<typeof calculateCompound>>["points"];
}) {
  const maximum = Math.max(
    ...points.map((point) => Math.max(point.total, point.invested)),
    1,
  );
  const x = (index: number) => 30 + (index / (points.length - 1)) * 480;
  const y = (value: number) => 170 - (value / maximum) * 140;
  const path = (key: "total" | "invested") =>
    points
      .map((point, index) => `${index ? "L" : "M"}${x(index)},${y(point[key])}`)
      .join(" ");
  return (
    <figure className="growth-chart">
      <figcaption>
        <span>
          <i className="balance-dot" /> Saldo projetado
        </span>
        <span>
          <i className="contribution-dot" /> Aportes
        </span>
      </figcaption>
      <svg
        viewBox="0 0 540 205"
        role="img"
        aria-label="Saldo projetado e aportes ao longo do tempo. Os valores exatos estão na tabela de evolução ano a ano."
      >
        {[0, 0.5, 1].map((fraction) => (
          <line
            key={fraction}
            x1="30"
            x2="510"
            y1={y(maximum * fraction)}
            y2={y(maximum * fraction)}
            className="chart-grid"
          />
        ))}
        <path
          d={`${path("total")} L510,170 L30,170 Z`}
          className="chart-area"
        />
        <path d={path("invested")} className="chart-contributions" />
        <path d={path("total")} className="chart-balance" />
        <circle
          cx="510"
          cy={y(points[points.length - 1].total)}
          r="4"
          className="chart-end"
        />
        <text x="30" y="196">
          Ano 0
        </text>
        <text x="510" y="196" textAnchor="end">
          Ano {points.length - 1}
        </text>
      </svg>
    </figure>
  );
}
