import { MonthlyDashboard } from "@/components/dashboard/monthly-dashboard";

// Datos temporales: se reemplazarán por consultas autenticadas a Supabase.
export default function Home() {
  return <MonthlyDashboard expenses={[]} subscriptions={[]} />;
}
