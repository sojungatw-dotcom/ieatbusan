# Password storage

Registration in server/backend.cjs sends the password directly to Supabase Auth. Supabase stores a salted bcrypt hash in auth.users.encrypted_password; public tables must not duplicate passwords or hashes. Login is verified through the Auth password endpoint.

ieb_profiles stores public profile data. ieb_signup_limits stores signup rate-limit buckets (key, started_at, attempts); it is not a member credential table.

Verified on 2026-11-09: all 11 existing Auth accounts have nonempty password hashes. No password hashes were read or exported.

Reference: https://supabase.com/docs/guides/auth/password-security
