-- Create index to optimize finding the latest transaction
CREATE INDEX IF NOT EXISTS transactions_created_at_idx ON public.transactions (created_at DESC);

-- Drop existing SELECT policies on transactions to cleanly apply new role-based logic
DROP POLICY IF EXISTS "Users can view their own transactions" ON public.transactions;
DROP POLICY IF EXISTS "Admins can view all transactions" ON public.transactions;
DROP POLICY IF EXISTS "Collaborator view latest" ON public.transactions;

-- Policy: Admins can view ALL transactions
-- Uses the is_admin() function which checks if the user has 'admin' role in profiles
CREATE POLICY "Admins can view all transactions" ON public.transactions
FOR SELECT
USING (
  public.is_admin()
);

-- Policy: Collaborators can view ONLY the single most recently registered transaction
-- This subquery ensures they can only select the row with the latest created_at timestamp
CREATE POLICY "Collaborators can view latest transaction" ON public.transactions
FOR SELECT
USING (
  (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'colaborador'
  AND
  id = (SELECT id FROM public.transactions ORDER BY created_at DESC LIMIT 1)
);

-- Note: Visitors (visitante) have no SELECT policy, so they see nothing by default (RLS deny all).
