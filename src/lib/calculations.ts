export function parseAmount(input: string): number | null {
  let value = input.trim().replace(/\s/g, "");
  if (!value) return null;
  if (value.includes(",") && value.includes(".")) {
    const commaLast = value.lastIndexOf(",") > value.lastIndexOf(".");
    const pattern = commaLast
      ? /^-?\d{1,3}(\.\d{3})+,\d+$/
      : /^-?\d{1,3}(,\d{3})+\.\d+$/;
    if (!pattern.test(value)) return null;
    value = commaLast
      ? value.replace(/\./g, "").replace(",", ".")
      : value.replace(/,/g, "");
  } else {
    value = value.replace(",", ".");
  }
  if (!/^-?(?:\d+(?:\.\d*)?|\.\d+)$/.test(value)) return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

export type ValuationInput = {
  price: number;
  eps: number | null;
  bvps: number | null;
  dividend: number | null;
  targetYield: number;
  margin: number;
};
export function calculateValuation(input: ValuationInput) {
  const { price, eps, bvps, dividend, targetYield, margin } = input;
  const rawGraham =
    eps !== null && bvps !== null && eps > 0 && bvps > 0
      ? Math.sqrt(22.5 * eps * bvps)
      : null;
  const rawBazin =
    dividend !== null && dividend >= 0 && targetYield > 0
      ? dividend / (targetYield / 100)
      : null;
  const graham =
    rawGraham !== null && Number.isFinite(rawGraham) ? rawGraham : null;
  const bazin =
    rawBazin !== null && Number.isFinite(rawBazin) ? rawBazin : null;
  return {
    graham,
    bazin,
    grahamEntry: graham === null ? null : graham * (1 - margin / 100),
    bazinEntry: bazin === null ? null : bazin * (1 - margin / 100),
    grahamUpside:
      graham === null || price <= 0 ? null : (graham / price - 1) * 100,
    bazinUpside:
      bazin === null || price <= 0 ? null : (bazin / price - 1) * 100,
    currentYield:
      dividend === null || price <= 0 ? null : (dividend / price) * 100,
    pe: eps === null || eps <= 0 ? null : price / eps,
    pb: bvps === null || bvps <= 0 ? null : price / bvps,
  };
}

export function calculateIncome(
  price: number,
  dividend: number,
  monthlyGoal: number,
  shares: number,
) {
  if (
    price <= 0 ||
    dividend <= 0 ||
    monthlyGoal < 0 ||
    shares < 0 ||
    !Number.isInteger(shares)
  )
    return null;
  const requiredShares = Math.ceil((monthlyGoal * 12) / dividend);
  const result = {
    requiredShares,
    requiredCapital: requiredShares * price,
    annualIncome: shares * dividend,
    monthlyAverage: (shares * dividend) / 12,
    additionalShares: Math.max(0, requiredShares - shares),
    yield: (dividend / price) * 100,
  };
  return Object.values(result).every(Number.isFinite) ? result : null;
}

export function calculateCompound(
  initial: number,
  monthly: number,
  annualRate: number,
  years: number,
  inflation: number,
) {
  if (
    initial < 0 ||
    monthly < 0 ||
    annualRate <= -100 ||
    inflation <= -100 ||
    years < 1 ||
    years > 60 ||
    !Number.isInteger(years)
  )
    return null;
  const monthlyRate = Math.expm1(Math.log1p(annualRate / 100) / 12);
  const points = Array.from({ length: years + 1 }, (_, year) => {
    const months = year * 12;
    const growth = Math.exp(Math.log1p(monthlyRate) * months);
    const contributionGrowth =
      monthlyRate === 0
        ? months
        : Math.expm1(Math.log1p(monthlyRate) * months) / monthlyRate;
    const total = initial * growth + monthly * contributionGrowth;
    return {
      year,
      total,
      invested: initial + monthly * months,
      real: total / Math.pow(1 + inflation / 100, year),
    };
  });
  if (!points.every((point) => Object.values(point).every(Number.isFinite)))
    return null;
  const last = points[points.length - 1];
  return {
    points,
    total: last.total,
    invested: last.invested,
    earnings: last.total - last.invested,
    real: last.real,
  };
}

export const currency = (value: number | null) =>
  value === null
    ? "—"
    : new Intl.NumberFormat("pt-BR", {
        style: "currency",
        currency: "BRL",
        maximumFractionDigits: 2,
      }).format(value);
export const percent = (value: number | null) =>
  value === null
    ? "—"
    : `${new Intl.NumberFormat("en", { maximumFractionDigits: 1 }).format(value)}%`;
