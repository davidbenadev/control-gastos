"use client";

import { useMemo, useState } from "react";
import { buildMonthDashboard, monthKey, type MonthKey } from "@/lib/dashboard";
import type { ExpenseWithRelations, Subscription } from "@/types/database";

interface MonthlyDashboardProps { initialMonth?: MonthKey; expenses: ExpenseWithRelations[]; subscriptions: Subscription[]; }
const money = new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" });
const dateLabel = (month: MonthKey) => new Intl.DateTimeFormat("es-MX", { month: "long", year: "numeric" }).format(new Date(`${month}-01T12:00:00`));
function moveMonth(month: MonthKey, delta: number): MonthKey { const [year, index] = month.split("-").map(Number); return monthKey(new Date(year, index - 1 + delta, 1)); }

export function MonthlyDashboard({ initialMonth = monthKey(new Date()), expenses, subscriptions }: MonthlyDashboardProps) {
  const [selectedMonth, setSelectedMonth] = useState<MonthKey>(initialMonth);
  const dashboard = useMemo(() => buildMonthDashboard(selectedMonth, expenses, subscriptions), [selectedMonth, expenses, subscriptions]);
  return <main className="mx-auto w-full max-w-6xl px-5 py-10 sm:px-8">
    <header className="mb-10 flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between"><div><p className="text-sm font-medium text-emerald-600">Control personal</p><h1 className="text-3xl font-bold tracking-tight">Resumen de gastos</h1></div><div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white p-1 shadow-sm"><button aria-label="Mes anterior" onClick={() => setSelectedMonth(moveMonth(selectedMonth, -1))} className="rounded-lg px-3 py-2 hover:bg-slate-100">←</button><span className="min-w-40 text-center text-sm font-semibold capitalize">{dateLabel(selectedMonth)}</span><button aria-label="Mes siguiente" onClick={() => setSelectedMonth(moveMonth(selectedMonth, 1))} className="rounded-lg px-3 py-2 hover:bg-slate-100">→</button></div></header>
    <section className="grid gap-4 sm:grid-cols-3"><Metric label="Gastos realizados" value={dashboard.expensesTotal} detail={`${dashboard.expenses.length} movimiento(s)`} /><Metric label="Suscripciones proyectadas" value={dashboard.subscriptionsTotal} detail={`${dashboard.subscriptions.length} cobro(s) fijo(s)`} accent="text-violet-600" /><Metric label="Total del periodo" value={dashboard.total} detail="Gastos + pagos fijos" accent="text-emerald-600" /></section>
    <section className="mt-8 grid gap-6 lg:grid-cols-2"><MovementList title="Movimientos" empty="No hay gastos registrados en este periodo." items={dashboard.expenses.map((item) => ({ id: item.id, name: item.name, detail: item.concept?.name ?? "Sin categoría", amount: item.amount }))} /><MovementList title="Suscripciones y pagos fijos" empty="No hay suscripciones previstas para este periodo." items={dashboard.subscriptions.map((item) => ({ id: item.id, name: item.name, detail: `${item.cycle === "monthly" ? "Mensual" : item.cycle === "yearly" ? "Anual" : "Semanal"} · ${item.next_charge_date}`, amount: item.amount }))} /></section>
  </main>;
}
function Metric({ label, value, detail, accent = "text-slate-950" }: { label: string; value: number; detail: string; accent?: string }) { return <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><p className="text-sm text-slate-500">{label}</p><p className={`mt-2 text-2xl font-bold ${accent}`}>{money.format(value)}</p><p className="mt-1 text-xs text-slate-400">{detail}</p></article>; }
function MovementList({ title, empty, items }: { title: string; empty: string; items: { id: string; name: string; detail: string; amount: number }[] }) { return <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><h2 className="font-semibold">{title}</h2>{items.length === 0 ? <p className="py-8 text-sm text-slate-500">{empty}</p> : <ul className="mt-3 divide-y divide-slate-100">{items.map((item) => <li key={item.id} className="flex items-center justify-between gap-4 py-3"><div><p className="font-medium">{item.name}</p><p className="text-xs text-slate-500">{item.detail}</p></div><span className="font-semibold">{money.format(item.amount)}</span></li>)}</ul>}</section>; }
