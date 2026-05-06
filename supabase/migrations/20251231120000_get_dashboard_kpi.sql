CREATE OR REPLACE FUNCTION public.get_dashboard_kpi(
  p_date_now DATE
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id UUID;
  v_total_balance NUMERIC;
  v_month_income NUMERIC;
  v_month_expense NUMERIC;
  v_last_month_income NUMERIC;
  v_last_month_expense NUMERIC;
  v_start_month DATE;
  v_start_last_month DATE;
  v_end_last_month DATE;
BEGIN
  v_user_id := auth.uid();
  v_start_month := date_trunc('month', p_date_now);
  v_start_last_month := date_trunc('month', p_date_now - INTERVAL '1 month');
  v_end_last_month := v_start_month - INTERVAL '1 day';
  
  -- Total Balance (All time)
  SELECT COALESCE(SUM(CASE WHEN type = 'Receita' THEN amount ELSE -amount END), 0)
  INTO v_total_balance
  FROM transactions
  WHERE user_id = v_user_id;
  
  -- Current Month Stats
  SELECT 
    COALESCE(SUM(CASE WHEN type = 'Receita' THEN amount ELSE 0 END), 0),
    COALESCE(SUM(CASE WHEN type = 'Despesa' THEN amount ELSE 0 END), 0)
  INTO v_month_income, v_month_expense
  FROM transactions
  WHERE user_id = v_user_id 
    AND date >= v_start_month 
    AND date <= p_date_now;
  
  -- Last Month Stats (for trends)
  SELECT 
    COALESCE(SUM(CASE WHEN type = 'Receita' THEN amount ELSE 0 END), 0),
    COALESCE(SUM(CASE WHEN type = 'Despesa' THEN amount ELSE 0 END), 0)
  INTO v_last_month_income, v_last_month_expense
  FROM transactions
  WHERE user_id = v_user_id 
    AND date >= v_start_last_month 
    AND date <= v_end_last_month;

  RETURN json_build_object(
    'totalBalance', v_total_balance,
    'monthIncome', v_month_income,
    'monthExpense', v_month_expense,
    'lastMonthIncome', v_last_month_income,
    'lastMonthExpense', v_last_month_expense
  );
END;
$$;
