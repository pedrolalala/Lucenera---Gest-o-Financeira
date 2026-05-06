-- Migration to allow Admins and Users to insert, update and delete transactions
-- Fixes HTTP 403 Error on Transaction Creation

-- 1. INSERT Policy
-- Drop any existing conflicting policies to ensure a clean slate
DROP POLICY IF EXISTS "Admins and users can insert transactions" ON public.transactions;
DROP POLICY IF EXISTS "Users can insert their own transactions" ON public.transactions;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON public.transactions;

CREATE POLICY "Admins and users can insert transactions" ON public.transactions
FOR INSERT
WITH CHECK (
  -- Admins can insert any transaction (enabling creating for others in future)
  public.is_admin()
  OR
  -- Users can insert transactions belonging to them
  auth.uid() = user_id
);

-- 2. UPDATE Policy
-- Ensure admins can update any transaction and users can update their own
DROP POLICY IF EXISTS "Admins can update all transactions" ON public.transactions;
DROP POLICY IF EXISTS "Users can update own transactions" ON public.transactions;

CREATE POLICY "Admins can update all transactions" ON public.transactions
FOR UPDATE
USING (public.is_admin());

CREATE POLICY "Users can update own transactions" ON public.transactions
FOR UPDATE
USING (auth.uid() = user_id);

-- 3. DELETE Policy
-- Ensure admins can delete any transaction and users can delete their own
DROP POLICY IF EXISTS "Admins can delete all transactions" ON public.transactions;
DROP POLICY IF EXISTS "Users can delete own transactions" ON public.transactions;

CREATE POLICY "Admins can delete all transactions" ON public.transactions
FOR DELETE
USING (public.is_admin());

CREATE POLICY "Users can delete own transactions" ON public.transactions
FOR DELETE
USING (auth.uid() = user_id);
