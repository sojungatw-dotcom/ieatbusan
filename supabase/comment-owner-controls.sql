-- Passwords remain managed by Supabase Auth (auth.users.encrypted_password).
-- Allow members to update only the body of their own comments.
grant update(body) on public.ieb_comments to authenticated;
drop policy if exists comments_update_own on public.ieb_comments;
create policy comments_update_own on public.ieb_comments for update to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);
