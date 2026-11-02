import { Metadata } from "next";

import DashboardContent from "./transaction/_components/dashboard-content";

export const metadata: Metadata = {
  title: "FInance-Dasboard",
  description: "Financial Dashboard",
};

export default function DashboardPage() {
  return (
    <div className="p-2 space-y-4">
      <section id="header">
        <h1 className="text-4xl font-bold text-primary gap">Dashboard</h1>
        <p>Spending Track expenses</p>
      </section>
      <DashboardContent />
    </div>
  );
}
