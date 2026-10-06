import { parseAmount } from "./calculations";

export const PORTFOLIO_STORAGE_KEY = "invest-calculator:portfolio:v1";
export const assetClasses = [
  {
    id: "fixedIncome",
    label: "Renda fixa",
    hint: "Tesouro, CDBs, LCIs, LCAs e similares",
  },
  { id: "realEstateFunds", label: "FIIs", hint: "Fundos imobiliários" },
  { id: "stocks", label: "Ações", hint: "Ações brasileiras" },
  { id: "etfs", label: "ETFs", hint: "Fundos de índice" },
  {
    id: "international",
    label: "Exterior",
    hint: "Investimentos internacionais, em reais",
  },
  {
    id: "crypto",
    label: "Criptoativos",
    hint: "Criptomoedas e ativos digitais",
  },
  { id: "cash", label: "Caixa", hint: "Saldo disponível, sem investimento" },
  {
    id: "other",
    label: "Outros",
    hint: "Investimentos fora das categorias acima",
  },
] as const;
export type AssetClassId = (typeof assetClasses)[number]["id"];
export type PortfolioValues = Record<AssetClassId, string>;
export const emptyPortfolio = (): PortfolioValues =>
  Object.fromEntries(assetClasses.map(({ id }) => [id, ""])) as PortfolioValues;

export function summarizePortfolio(values: PortfolioValues) {
  const amounts = assetClasses.map(({ id }) =>
    values[id].trim() ? parseAmount(values[id]) : 0,
  );
  if (amounts.some((value) => value === null || value < 0 || value > 1e12))
    return null;
  const total = amounts.reduce<number>((sum, value) => sum + value!, 0);
  const allocation = assetClasses.map((category, index) => ({
    ...category,
    amount: amounts[index]!,
    percentage: total > 0 ? (amounts[index]! / total) * 100 : 0,
  }));
  return {
    total,
    allocation,
    activeCategories: allocation.filter((category) => category.amount > 0)
      .length,
  };
}

export function restorePortfolio(raw: string): PortfolioValues {
  const data: unknown = JSON.parse(raw);
  if (
    !data ||
    typeof data !== "object" ||
    !("version" in data) ||
    data.version !== 1 ||
    !("values" in data) ||
    !data.values ||
    typeof data.values !== "object"
  )
    throw new Error("Invalid portfolio data");
  const values = emptyPortfolio();
  for (const { id } of assetClasses) {
    if (!(id in data.values)) throw new Error("Missing portfolio category");
    const value = (data.values as Record<string, unknown>)[id];
    if (typeof value !== "string") throw new Error("Invalid portfolio amount");
    values[id] = value;
  }
  if (!summarizePortfolio(values)) throw new Error("Invalid portfolio amounts");
  return values;
}
