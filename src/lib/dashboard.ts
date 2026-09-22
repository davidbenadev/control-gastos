import type { ExpenseWithRelations, Subscription } from "@/types/database";

export type MonthKey = `${number}-${string}`;
export interface MonthDashboard { month: MonthKey; expenses: ExpenseWithRelations[]; subscriptions: Subscription[]; expensesTotal: number; subscriptionsTotal: number; total: number; }

export function monthKey(date: Date): MonthKey {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

export function buildMonthDashboard(month: MonthKey, expenses: ExpenseWithRelations[], subscriptions: Subscription[]): MonthDashboard {
  const matchesMonth = (date: string) => date.slice(0, 7) === month;
  const monthExpenses = expenses.filter((expense) => matchesMonth(expense.expense_date));
  const monthSubscriptions = subscriptions.filter((subscription) => subscription.is_active && subscriptionOccursInMonth(subscription, month));
  const sum = (items: { amount: number }[]) => items.reduce((total, item) => total + item.amount, 0);
  const expensesTotal = sum(monthExpenses);
  const subscriptionsTotal = sum(monthSubscriptions);
  return { month, expenses: monthExpenses, subscriptions: monthSubscriptions, expensesTotal, subscriptionsTotal, total: expensesTotal + subscriptionsTotal };
}

function subscriptionOccursInMonth(subscription: Subscription, month: MonthKey) {
  const [year, targetMonth] = month.split("-").map(Number);
  const start = new Date(`${subscription.start_date}T12:00:00`);
  const monthsSinceStart = (year - start.getFullYear()) * 12 + (targetMonth - 1 - start.getMonth());
  if (monthsSinceStart < 0) return false;
  if (subscription.cycle === "monthly") return true;
  if (subscription.cycle === "yearly") return monthsSinceStart % 12 === 0;
  const monthStart = new Date(year, targetMonth - 1, 1);
  const monthEnd = new Date(year, targetMonth, 0);
  const daysUntilMonth = Math.ceil((monthStart.getTime() - start.getTime()) / 86_400_000);
  const firstCharge = Math.max(0, Math.ceil(daysUntilMonth / 7)) * 7;
  return new Date(start.getTime() + firstCharge * 86_400_000) <= monthEnd;
}
