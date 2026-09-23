export type CardType = "debit" | "credit";
export type ExpenseKind = "one_time" | "recurring";
export type BillingCycle = "weekly" | "monthly" | "yearly";

export interface Card {
  id: string; user_id: string; name: string; bank_name: string | null; type: CardType;
  last_four: string | null; credit_limit: number | null; cutoff_day: number | null;
  payment_due_day: number | null; is_active: boolean; created_at: string; updated_at: string;
}

export interface Concept {
  id: string; user_id: string; name: string; color: string | null; icon: string | null;
  is_active: boolean; created_at: string; updated_at: string;
}

export interface Subscription {
  id: string; user_id: string; card_id: string; concept_id: string | null; name: string;
  amount: number; currency: string; cycle: BillingCycle; billing_day: number | null;
  start_date: string; end_date: string | null; next_charge_date: string; is_active: boolean; notes: string | null;
  created_at: string; updated_at: string;
}

export interface Expense {
  id: string; user_id: string; card_id: string | null; concept_id: string | null; name: string;
  amount: number; currency: string; expense_date: string; kind: ExpenseKind;
  recurrence_cycle: BillingCycle | null; recurrence_end_date: string | null; notes: string | null;
  created_at: string; updated_at: string;
}

export type ExpenseWithRelations = Expense & { concept?: Pick<Concept, "name" | "color"> | null; card?: Pick<Card, "name" | "last_four"> | null };
