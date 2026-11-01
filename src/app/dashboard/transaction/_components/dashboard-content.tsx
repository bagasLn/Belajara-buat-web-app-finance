import { BalanceCards } from "../../_components/balance-card";
import WizardInput from "./wizard-input";

export default function DashboardContent() {
  return (
    <section id="content" className="space-y-4">
      <WizardInput />
      <BalanceCards />
    </section>
  );
}
