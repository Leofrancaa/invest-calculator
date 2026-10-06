"use client";

import Link from "next/link";
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
  calculateCompound,
  calculateIncome,
  calculateValuation,
  currency,
  parseAmount,
  percent,
} from "@/lib/calculations";

type Tool = "valuation" | "income" | "compound";
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
    id: "valuation" as const,
    label: "Stock valuation",
    icon: Landmark,
    description: "Graham & Bazin",
  },
  {
    id: "income" as const,
    label: "Dividend income",
    icon: Wallet,
    description: "Plan your monthly goal",
  },
  {
    id: "compound" as const,
    label: "Compound growth",
    icon: TrendingUp,
    description: "See the long-term picture",
  },
];
const titles = {
  valuation: [
    "A clearer view of value.",
    "Bring the numbers. Explore the price.",
  ],
  income: [
    "Put a number on your goal.",
    "Turn dividend assumptions into an income plan.",
  ],
  compound: ["Give your money time.", "Explore what consistency could build."],
};

function Field({
  id,
  label,
  hint,
  value,
  onChange,
  suffix = "R$",
  optional = false,
  min = 0,
  max = 1e9,
  integer = false,
  required = false,
}: {
  id: string;
  label: string;
  hint?: string;
  value: string;
  onChange: (value: string) => void;
  suffix?: string;
  optional?: boolean;
  min?: number;
  max?: number;
  integer?: boolean;
  required?: boolean;
}) {
  const number = parseAmount(value);
  const invalid = value.trim()
    ? number === null ||
      number < min ||
      number > max ||
      (integer && !Number.isInteger(number))
    : false;
  const error = integer
    ? `Enter a whole number from ${min} to ${max}.`
    : `Enter a number from ${min} to ${max}.`;
  return (
    <div className="field">
      <label htmlFor={id}>
        {label}
        {optional && <span>optional</span>}
      </label>
      <div className={`input-wrap ${invalid ? "invalid" : ""}`}>
        <input
          id={id}
          type="text"
          inputMode={integer ? "numeric" : "decimal"}
          autoComplete="off"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder="0.00"
          aria-required={required}
          aria-invalid={invalid}
          aria-describedby={`${id}-help`}
        />
        <span aria-hidden="true">{suffix}</span>
      </div>
      <p id={`${id}-help`} className={invalid ? "field-error" : "field-help"}>
        {invalid ? error : hint || " "}
      </p>
    </div>
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
      <h3>Your numbers, your perspective.</h3>
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
          "Saved scenarios could not be read. You can still use every calculator.",
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
        "Updated for this session. Browser storage is unavailable; export a CSV to keep your scenarios.",
      );
    }
  }
  function save(entry: Omit<SavedScenario, "id">) {
    if (saved.length >= 12) {
      setStatus("You have 12 scenarios. Remove one before saving another.");
      return;
    }
    persist(
      [...saved, { ...entry, id: crypto.randomUUID() }],
      "Scenario saved on this device.",
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
        "Scenario",
        "Price BRL",
        "Graham BRL",
        "Bazin BRL",
        "Safety margin %",
        "Graham entry BRL",
        "Bazin entry BRL",
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
    setStatus("Scenarios exported as CSV.");
  }
  return (
    <div className="app-shell">
      <a href="#main" className="skip-link">
        Skip to calculator
      </a>
      <header className="app-header">
        <Link href="/" className="brand" aria-label="Invest Calculator home">
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
              Sign out
            </button>
          </form>
          <span className="privacy">
            <ShieldCheck size={15} /> Private by design
          </span>
          <a
            href="https://investidor10.com.br/acoes/"
            target="_blank"
            rel="noopener noreferrer"
            className="external-link"
          >
            Open Investidor10 <ArrowUpRight size={16} />
            <span className="sr-only"> (opens in a new tab)</span>
          </a>
        </div>
      </header>
      <div className="workspace">
        <aside className="sidebar">
          <div>
            <p className="nav-title">Your workbench</p>
            <nav aria-label="Calculators">
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
            <h3>A second perspective.</h3>
            <p>
              Use the indicators you already follow. Keep your assumptions in
              your hands.
            </p>
            <a href="#methods">
              Understand the formulas <ArrowRight size={14} />
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
              <span /> Manual inputs · BRL
            </span>
          </div>
          <div className="tool-container" key={tool}>
            {tool === "valuation" ? (
              <Valuation onSave={save} canSave={loaded && saved.length < 12} />
            ) : tool === "income" ? (
              <Income />
            ) : (
              <Compound />
            )}
          </div>
          {tool === "valuation" && (
            <section className="saved-section" aria-labelledby="saved-title">
              <div className="section-heading">
                <div>
                  <h2 id="saved-title">
                    Your comparison shelf{" "}
                    <span>{saved.length.toString().padStart(2, "0")}</span>
                  </h2>
                  <p>
                    Saved assumptions, side by side. Stored only in this
                    browser.
                  </p>
                </div>
                <button
                  className="button secondary small"
                  onClick={exportCsv}
                  disabled={!saved.length}
                >
                  <ArrowDownToLine size={15} /> Export CSV
                </button>
              </div>
              {saved.length ? (
                <div
                  className="table-scroll"
                  tabIndex={0}
                  role="region"
                  aria-label="Saved scenarios table"
                >
                  <table>
                    <caption className="sr-only">
                      Saved stock valuation scenarios
                    </caption>
                    <thead>
                      <tr>
                        <th>Scenario</th>
                        <th>Current price</th>
                        <th>Graham</th>
                        <th>Bazin</th>
                        <th>Safety margin</th>
                        <th>Graham entry</th>
                        <th>Bazin entry</th>
                        <th>
                          <span className="sr-only">Actions</span>
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
                              aria-label={`Remove ${entry.name}`}
                              onClick={() =>
                                persist(
                                  saved.filter((item) => item.id !== entry.id),
                                  `${entry.name} removed. Export first if you need a permanent copy.`,
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
                    A useful comparison starts with one scenario.
                    <span>Fill in an asset above and save it here.</span>
                  </p>
                </div>
              )}
            </section>
          )}
          <div role="status" className="status-message">
            {status}
          </div>
          <footer className="footer">
            <span>Independent tool. No subscription.</span>
            <span>Calculations happen on your device.</span>
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
    setName("EXAMPLE");
    setPrice("25");
    setEps("3");
    setBvps("20");
    setDividend("1.80");
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
            <h2 id="asset-title">Asset fundamentals</h2>
            <button className="text-button" onClick={loadExample}>
              Load example <ArrowUpRight size={13} />
            </button>
          </div>
          <p className="panel-description">
            Copy these from the asset’s indicators page.
          </p>
          {example && (
            <p className="example-notice">
              Illustrative numbers. This is not a live quote.
            </p>
          )}
          <form noValidate onSubmit={(event) => event.preventDefault()}>
            <div className="field">
              <label htmlFor="asset-name">
                Asset or scenario<span>optional</span>
              </label>
              <div className="input-wrap">
                <input
                  id="asset-name"
                  autoComplete="off"
                  maxLength={40}
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder="e.g. BBAS3 · conservative"
                />
              </div>
              <p className="field-help">A label for your comparison shelf.</p>
            </div>
            <Field
              id="price"
              label="Current share price"
              value={price}
              onChange={setPrice}
              hint="The price you want to compare against."
              min={0.000001}
              required
            />
            <div className="field-pair">
              <Field
                id="eps"
                label="Earnings per share"
                value={eps}
                onChange={setEps}
                min={-1e9}
                hint="LPA · last 12 months"
                optional
              />
              <Field
                id="bvps"
                label="Book value per share"
                value={bvps}
                onChange={setBvps}
                min={-1e9}
                hint="VPA · latest balance sheet"
                optional
              />
            </div>
            <div className="field-pair">
              <Field
                id="dividend"
                label="Annual dividends / share"
                value={dividend}
                onChange={setDividend}
                hint="Total proventos · last 12 months"
                optional
              />
              <Field
                id="target-yield"
                label="Target dividend yield"
                value={targetYield}
                onChange={setTargetYield}
                suffix="%"
                min={0.01}
                max={100}
                hint="Bazin reference: 6% per year"
              />
            </div>
            <div className="margin-control">
              <div>
                <label htmlFor="safety-margin">Safety margin</label>
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
              <p>A discount applied to each model’s estimated price.</p>
            </div>
            <div className="input-actions">
              <span>
                <Check size={14} /> Updates as you type
              </span>
              <button className="text-button" onClick={reset} type="button">
                <RotateCcw size={13} /> Reset
              </button>
            </div>
          </form>
        </section>
        <section className="results-panel" aria-labelledby="results-title">
          <div className="panel-heading">
            <h2 id="results-title">The valuation lens</h2>
            <span className="subtle-tag">Two methods</span>
          </div>
          {result ? (
            <>
              <div className="valuation-results">
                <Metric
                  label="Graham fair value"
                  value={currency(result.graham)}
                  detail={
                    result.grahamUpside !== null ? (
                      <span
                        className={
                          result.grahamUpside >= 0 ? "positive" : "negative"
                        }
                      >
                        {percent(result.grahamUpside)} vs. current price
                      </span>
                    ) : (
                      "Requires positive LPA and VPA"
                    )
                  }
                />
                <Metric
                  label="Bazin ceiling price"
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
                        {percent(result.bazinUpside)} vs. current price
                      </span>
                    ) : (
                      "Enter annual dividends and a valid yield"
                    )
                  }
                />
              </div>
              <div className="entry-band">
                <div className="entry-heading">
                  <ShieldCheck size={18} />
                  <span>Entry prices with {margin}% safety margin</span>
                </div>
                <div className="entry-values">
                  <div>
                    <span>Graham entry</span>
                    <strong>{currency(result.grahamEntry)}</strong>
                  </div>
                  <div>
                    <span>Bazin entry</span>
                    <strong>{currency(safeBazinEntry)}</strong>
                  </div>
                </div>
              </div>
              <div className="quick-metrics">
                <div>
                  <span>P/E · P/L</span>
                  <strong>
                    {result.pe === null ? "—" : `${result.pe.toFixed(2)}×`}
                  </strong>
                </div>
                <div>
                  <span>P/B · P/VP</span>
                  <strong>
                    {result.pb === null ? "—" : `${result.pb.toFixed(2)}×`}
                  </strong>
                </div>
                <div>
                  <span>Dividend yield</span>
                  <strong>{percent(result.currentYield)}</strong>
                </div>
              </div>
              <div className="scenario-heading">
                <h3>Explore your buffer</h3>
                <span>Entry price by discount</span>
              </div>
              <div
                className="table-scroll"
                tabIndex={0}
                role="region"
                aria-label="Safety margin comparison table"
              >
                <table className="buffer-table">
                  <caption className="sr-only">
                    Entry prices at different safety margins
                  </caption>
                  <thead>
                    <tr>
                      <th>Safety margin</th>
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
                    name: name.trim() || "Untitled scenario",
                    price: priceValue!,
                    graham: result.graham,
                    bazin: safeBazin,
                    margin,
                    grahamEntry: result.grahamEntry,
                    bazinEntry: safeBazinEntry,
                  })
                }
              >
                <BookmarkPlus size={17} /> Save to comparison shelf{" "}
                <ArrowRight size={16} />
              </button>
            </>
          ) : (
            <EmptyResult>
              Enter a share price and either LPA + VPA or annual dividends to
              see your estimates. You can also load an example.
            </EmptyResult>
          )}
          <Note>
            These models use your inputs, not forecasts. They do not determine a
            company’s actual value or a buy recommendation.
          </Note>
        </section>
      </div>
      <section id="methods" className="methods-section">
        <h2>Know what’s behind the number.</h2>
        <div className="methods-grid">
          <details>
            <summary>
              Graham: earnings meet equity <Plus size={16} />
            </summary>
            <div>
              <code>√(22.5 × LPA × VPA)</code>
              <p>
                The Graham number combines a P/E of 15 and a P/B of 1.5. Both
                earnings and book value must be positive. This model can be less
                meaningful for asset-light companies or unusual earnings.
              </p>
              <a
                href="https://investidor10.com.br/conteudo/benjamin-graham/"
                target="_blank"
                rel="noopener noreferrer"
              >
                Method reference <ExternalLink size={12} />
                <span className="sr-only"> (opens in a new tab)</span>
              </a>
            </div>
          </details>
          <details>
            <summary>
              Bazin: income sets the ceiling <Plus size={16} />
            </summary>
            <div>
              <code>Annual dividends per share ÷ target yield</code>
              <p>
                At a 6% target yield, R$ 1.80 in annual dividends implies R$
                30.00. This is the yield-based price calculation only, not
                Bazin’s full company selection criteria. One-off payouts can
                inflate the estimate.
              </p>
            </div>
          </details>
          <details>
            <summary>
              Safety margin & input consistency <Plus size={16} />
            </summary>
            <div>
              <code>Model price × (1 − safety margin)</code>
              <p>
                Upside is model price ÷ current price − 1. Use per-share figures
                adjusted to the same share basis, and a consistent period.
                Dividends are entered in reais per share, not as a yield
                percentage. Commas and dots are accepted as decimal separators.
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
            <h2>Income assumptions</h2>
            <button
              className="text-button"
              onClick={() => {
                setPrice("25");
                setDividend("1.80");
                setGoal("1000");
                setShares("100");
                setExample(true);
              }}
            >
              Load example <ArrowUpRight size={13} />
            </button>
          </div>
          <p className="panel-description">
            Use annual payouts to plan an average monthly income.
          </p>
          {example && (
            <p className="example-notice">
              Illustrative numbers. This is not a live quote.
            </p>
          )}
          <form noValidate onSubmit={(event) => event.preventDefault()}>
            <Field
              id="income-price"
              label="Current share price"
              value={price}
              onChange={setPrice}
              min={0.000001}
              hint="Purchase price used for the capital estimate."
            />
            <Field
              id="income-dividend"
              label="Annual dividends / share"
              value={dividend}
              onChange={setDividend}
              min={0.000001}
              hint="Total per share over a full year."
            />
            <Field
              id="income-goal"
              label="Monthly income goal"
              value={goal}
              onChange={setGoal}
              hint="The average income you would like to receive."
            />
            <Field
              id="income-shares"
              label="Shares you already own"
              value={shares}
              onChange={setShares}
              suffix="shares"
              integer
              hint="Whole shares · use 0 if you are starting."
            />
          </form>
          <Note>
            Payouts fluctuate. Monthly average does not mean the asset pays
            every month.
          </Note>
        </section>
        <section className="results-panel">
          <div className="panel-heading">
            <h2>Your income plan</h2>
            <span className="subtle-tag">Annual basis</span>
          </div>
          {result ? (
            <>
              <div className="valuation-results">
                <Metric
                  label="Shares needed for your goal"
                  value={result.requiredShares.toLocaleString("en")}
                  detail="Rounded up to a whole share"
                />
                <Metric
                  label="Estimated capital needed"
                  value={currency(result.requiredCapital)}
                  detail={`At ${currency(values[0])} per share`}
                />
              </div>
              <div className="entry-band">
                <div className="entry-heading">
                  <Wallet size={18} />
                  <span>From your current holdings</span>
                </div>
                <div className="entry-values">
                  <div>
                    <span>Monthly average</span>
                    <strong>{currency(result.monthlyAverage)}</strong>
                  </div>
                  <div>
                    <span>Annual income</span>
                    <strong>{currency(result.annualIncome)}</strong>
                  </div>
                </div>
              </div>
              <div className="income-list">
                <div>
                  <span>Additional shares to reach the goal</span>
                  <strong>
                    {result.additionalShares.toLocaleString("en")}
                  </strong>
                </div>
                <div>
                  <span>Additional capital</span>
                  <strong>
                    {currency(result.additionalShares * values[0]!)}
                  </strong>
                </div>
                <div>
                  <span>Dividend yield at this price</span>
                  <strong>{percent(result.yield)}</strong>
                </div>
              </div>
            </>
          ) : (
            <EmptyResult>
              Enter a positive share price and annual dividend to calculate how
              many shares your goal would require.
            </EmptyResult>
          )}
          <Note>
            Gross estimates before taxes and fees. Assumes the entered dividend
            remains constant and no reinvestment.
          </Note>
        </section>
      </div>
      <section id="methods" className="methods-section">
        <h2>The income math.</h2>
        <p className="method-inline">
          Required shares = monthly goal × 12 ÷ annual dividends per share,
          rounded up. Capital = required shares × share price.
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
            <h2>Growth assumptions</h2>
            <span className="subtle-tag">Simulation</span>
          </div>
          <p className="panel-description">
            Adjust the inputs to explore a possible future.
          </p>
          <form noValidate onSubmit={(event) => event.preventDefault()}>
            <Field
              id="initial"
              label="Initial investment"
              value={initial}
              onChange={setInitial}
              hint="Your starting balance."
            />
            <Field
              id="monthly"
              label="Monthly contribution"
              value={monthly}
              onChange={setMonthly}
              hint="Added at the end of each month."
            />
            <div className="field-pair">
              <Field
                id="annual-rate"
                label="Annual return"
                value={rate}
                onChange={setRate}
                min={-99}
                max={100}
                suffix="%"
                hint="Effective annual rate"
              />
              <Field
                id="years"
                label="Investment period"
                value={years}
                onChange={setYears}
                min={1}
                max={60}
                integer
                suffix="years"
                hint="Between 1 and 60 years"
              />
            </div>
            <Field
              id="inflation"
              label="Annual inflation"
              value={inflation}
              onChange={setInflation}
              min={-99}
              max={100}
              suffix="%"
              hint="Used to estimate purchasing power in today’s reais."
            />
          </form>
          <Note>
            Example assumptions, not a forecast. Returns are constant in this
            simulation.
          </Note>
        </section>
        <section className="results-panel">
          <div className="panel-heading">
            <h2>The long-term picture</h2>
            <span className="subtle-tag">
              {valid(years, 1, 60, true) ?? "—"} years
            </span>
          </div>
          {result ? (
            <>
              <div className="valuation-results">
                <Metric
                  label="Projected balance"
                  value={currency(result.total)}
                />
                <Metric
                  label="In today’s purchasing power"
                  value={currency(result.real)}
                />
              </div>
              <GrowthChart points={result.points} />
              <div className="quick-metrics growth-metrics">
                <div>
                  <span>Your contributions</span>
                  <strong>{currency(result.invested)}</strong>
                </div>
                <div>
                  <span>Investment gain / loss</span>
                  <strong>{currency(result.earnings)}</strong>
                </div>
              </div>
              <details className="year-breakdown">
                <summary>
                  View the year-by-year breakdown <Plus size={15} />
                </summary>
                <div
                  className="table-scroll"
                  tabIndex={0}
                  role="region"
                  aria-label="Year-by-year projection table"
                >
                  <table>
                    <thead>
                      <tr>
                        <th>Year</th>
                        <th>Contributed</th>
                        <th>Balance</th>
                        <th>Today’s money</th>
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
              Enter valid values to see the projection. Use whole years between
              1 and 60.
            </EmptyResult>
          )}
          <Note>
            Effective annual rates are converted to monthly rates. Contributions
            stay fixed in nominal reais. Taxes and fees are excluded.
          </Note>
        </section>
      </div>
      <section id="methods" className="methods-section">
        <h2>Small contributions. A longer horizon.</h2>
        <p className="method-inline">
          Monthly rate = (1 + annual rate)^(1/12) − 1. Each contribution starts
          earning after the month it is added. Inflation-adjusted balance =
          nominal balance ÷ (1 + inflation)^years.
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
          <i className="balance-dot" /> Projected balance
        </span>
        <span>
          <i className="contribution-dot" /> Contributions
        </span>
      </figcaption>
      <svg
        viewBox="0 0 540 205"
        role="img"
        aria-label="Projected balance and contributions over time. Exact values are available in the year-by-year breakdown."
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
          Year 0
        </text>
        <text x="510" y="196" textAnchor="end">
          Year {points.length - 1}
        </text>
      </svg>
    </figure>
  );
}
