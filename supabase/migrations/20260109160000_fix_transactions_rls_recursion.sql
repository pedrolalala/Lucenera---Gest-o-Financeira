-- Fix recursion in RLS by using Security Definer functions to break the cycle
-- The previous policy selected from 'transactions' inside the 'transactions' policy, causing infinite recursion.
-- We use a SECURITY DEFINER function to get the latest ID, which bypasses RLS on the table it queries.

-- Function to get the latest transaction ID safely
CREATE OR REPLACE FUNCTION public.get_latest_transaction_id()
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Deterministic sort order matching the service layer
  RETURN (SELECT id FROM public.transactions ORDER BY created_at DESC, id DESC LIMIT 1);
END;
$$;

-- Function to get current user role safely
CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN (SELECT role FROM public.profiles WHERE id = auth.uid());
END;
$$;

-- Drop existing policies to ensure clean state
DROP POLICY IF EXISTS "Admins can view all transactions" ON public.transactions;
DROP POLICY IF EXISTS "Collaborators can view latest transaction" ON public.transactions;
DROP POLICY IF EXISTS "Collaborators can view latest" ON public.transactions; -- Backup name cleanup
DROP POLICY IF EXISTS "Users can view their own transactions" ON public.transactions;

-- 1. Admin Policy: View All
CREATE POLICY "Admins can view all transactions" ON public.transactions
FOR SELECT
USING (
  public.is_admin()
);

-- 2. Collaborator Policy: View Latest Only
-- Uses the helper function to avoid recursion
CREATE POLICY "Collaborators can view latest transaction" ON public.transactions
FOR SELECT
USING (
  public.get_user_role() = 'colaborador'
  AND
  id = public.get_latest_transaction_id()
);

-- 3. Standard User Policy: View Own Data
-- Applies to users who are NOT admin and NOT colaborador, restoring standard security
CREATE POLICY "Standard users can view own transactions" ON public.transactions
FOR SELECT
USING (
  COALESCE(public.get_user_role(), 'visitante') NOT IN ('admin', 'colaborador')
  AND
  user_id = auth.uid()
);
