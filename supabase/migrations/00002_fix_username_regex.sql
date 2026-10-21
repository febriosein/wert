-- Fix Postgres regex character range for username
ALTER TABLE public.users DROP CONSTRAINT IF EXISTS username_format;

ALTER TABLE public.users ADD CONSTRAINT username_format CHECK (
    length(username) >= 3 AND 
    length(username) <= 20 AND 
    username ~ '^[a-z0-9][a-z0-9_-]*[a-z0-9]$'
);
