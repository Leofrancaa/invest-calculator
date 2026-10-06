import { CalculatorWorkspace } from "@/components/calculator-workspace";
import { requireAdmin } from "@/lib/auth";
export default async function Page() {
  await requireAdmin();
  return <CalculatorWorkspace />;
}
