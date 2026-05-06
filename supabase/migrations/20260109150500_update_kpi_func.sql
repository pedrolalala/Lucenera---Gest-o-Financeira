-- Update get_dashboard_kpi to be SECURITY INVOKER
-- This ensures the function respects the RLS policies defined on the transactions table
-- Admin -> Calculates sums for all transactions
-- Collaborator -> Calculates sums for only the latest transaction (restricted view)
-- Visitor -> Calculates 0 (no access)

CREATE OR REPLACE FUNCTION public.get_dashboard_kpi(p_date_now DATE)
RETURNS JSON
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
DECLARE
  v_total_balance NUMERIC;
  v_month_income NUMERIC;
  v_month_expense NUMERIC;
  v_last_month_income NUMERIC;
  v_last_month_expense NUMERIC;
  v_start_month DATE;
  v_end_month DATE;
  v_start_last_month DATE;
  v_end_last_month DATE;
BEGIN
  v_start_month := date_trunc('month', p_date_now);
  v_end_month := (date_trunc('month', p_date_now) + interval '1 month' - interval '1 day')::date;
  v_start_last_month := date_trunc('month', p_date_now - interval '1 month');
  v_end_last_month := (date_trunc('month', p_date_now) - interval '1 day')::date;

  -- Calculate Total Balance (All time based on visibility)
  SELECT COALESCE(SUM(CASE WHEN type = 'Receita' THEN amount ELSE -amount END), 0)
  INTO v_total_balance
  FROM public.transactions;

  -- Calculate Month Income
  SELECT COALESCE(SUM(amount), 0)
  INTO v_month_income
  FROM public.transactions
  WHERE type = 'Receita' AND date >= v_start_month AND date <= v_end_month;

  -- Calculate Month Expense
  SELECT COALESCE(SUM(amount), 0)
  INTO v_month_expense
  FROM public.transactions
  WHERE type = 'Despesa' AND date >= v_start_month AND date <= v_end_month;

  -- Calculate Last Month Income
  SELECT COALESCE(SUM(amount), 0)
  INTO v_last_month_income
  FROM public.transactions
  WHERE type = 'Receita' AND date >= v_start_last_month AND date <= v_end_last_month;

  -- Calculate Last Month Expense
  SELECT COALESCE(SUM(amount), 0)
  INTO v_last_month_expense
  FROM public.transactions
  WHERE type = 'Despesa' AND date >= v_start_last_month AND date <= v_end_last_month;

  RETURN json_build_object(
    'totalBalance', v_total_balance,
    'monthIncome', v_month_income,
    'monthExpense', v_month_expense,
    'lastMonthIncome', v_last_month_income,
    'lastMonthExpense', v_last_month_expense
  );
END;
$$;
