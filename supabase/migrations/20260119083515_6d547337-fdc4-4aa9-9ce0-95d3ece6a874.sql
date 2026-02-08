-- Strengthen push_subscriptions RLS policies
-- Drop existing policies and recreate with stricter rules
DROP POLICY IF EXISTS "Users can view own subscriptions" ON public.push_subscriptions;
DROP POLICY IF EXISTS "Users can insert own subscriptions" ON public.push_subscriptions;
DROP POLICY IF EXISTS "Users can delete own subscriptions" ON public.push_subscriptions;

-- More restrictive policies - users can only access their own subscriptions
CREATE POLICY "Users can view own push subscriptions"
ON public.push_subscriptions FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own push subscriptions"
ON public.push_subscriptions FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own push subscriptions"
ON public.push_subscriptions FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own push subscriptions"
ON public.push_subscriptions FOR DELETE
USING (auth.uid() = user_id);