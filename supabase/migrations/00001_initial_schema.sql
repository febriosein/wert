-- Enable citext and pgcrypto extensions
CREATE EXTENSION IF NOT EXISTS "citext";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. USERS TABLE
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username CITEXT UNIQUE NOT NULL,
    pin_hash TEXT,
    pin_failed_count INT NOT NULL DEFAULT 0,
    pin_locked_until TIMESTAMPTZ,
    recovery_hash TEXT,
    auto_delete_enabled BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    last_active_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT username_format CHECK (
        length(username) >= 3 AND 
        length(username) <= 20 AND 
        username ~ '^[a-z0-9][a-z0-9_-]*[a-z0-9]$'
    )
);

-- Reserved usernames check constraint or function
CREATE OR REPLACE FUNCTION public.check_reserved_username()
RETURNS TRIGGER AS $$
DECLARE
    reserved_words TEXT[] := ARRAY[
        'admin', 'administrator', 'api', 'app', 'auth', 'login', 'logout', 
        'register', 'settings', 'u', 'privacy', 'terms', 'static', 'www', 
        'wert', 'files', 'cron', 'dashboard', 'download', 'upload', 'public',
        'account', 'help', 'status', 'about', 'contact', 'legal'
    ];
BEGIN
    IF LOWER(NEW.username::text) = ANY(reserved_words) THEN
        RAISE EXCEPTION 'Username "%" is reserved and cannot be used.', NEW.username;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER trigger_check_reserved_username
BEFORE INSERT OR UPDATE OF username ON public.users
FOR EACH ROW EXECUTE FUNCTION public.check_reserved_username();

-- 2. SESSIONS TABLE
CREATE TABLE IF NOT EXISTS public.sessions (
    id_hash TEXT PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    expires_at TIMESTAMPTZ NOT NULL,
    last_seen_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    ip_hash TEXT
);

-- 3. FILES TABLE
CREATE TABLE IF NOT EXISTS public.files (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    display_name TEXT NOT NULL,
    ext TEXT NOT NULL,
    mime TEXT NOT NULL,
    size_bytes BIGINT NOT NULL,
    storage_key TEXT NOT NULL,
    kind TEXT NOT NULL CHECK (kind IN ('document', 'image', 'archive')),
    status TEXT NOT NULL DEFAULT 'uploading' CHECK (status IN ('uploading', 'ready', 'processing', 'failed')),
    pdf_key TEXT,
    docx_key TEXT,
    preview_key TEXT,
    page_count INT,
    missing_fonts JSONB DEFAULT '[]'::jsonb,
    version INT NOT NULL DEFAULT 1,
    expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4. UPLOAD TOKENS (for mobile QR upload)
CREATE TABLE IF NOT EXISTS public.upload_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    token_hash TEXT NOT NULL UNIQUE,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    max_files INT NOT NULL DEFAULT 20,
    files_uploaded INT NOT NULL DEFAULT 0,
    expires_at TIMESTAMPTZ NOT NULL,
    revoked_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 5. CONVERSION JOBS TABLE
CREATE TABLE IF NOT EXISTS public.conversion_jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    file_id UUID NOT NULL REFERENCES public.files(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN (
        'docx_to_pdf', 
        'pptx_to_pdf', 
        'xlsx_to_pdf', 
        'heic_to_jpg', 
        'pdf_to_docx_precision', 
        'pdf_to_docx_editable'
    )),
    status TEXT NOT NULL DEFAULT 'queued' CHECK (status IN ('queued', 'running', 'done', 'failed')),
    attempts INT NOT NULL DEFAULT 0,
    error TEXT,
    started_at TIMESTAMPTZ,
    finished_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- INDEXES
CREATE INDEX IF NOT EXISTS idx_users_username ON public.users(username);
CREATE INDEX IF NOT EXISTS idx_users_last_active ON public.users(last_active_at);
CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON public.sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_expires ON public.sessions(expires_at);
CREATE INDEX IF NOT EXISTS idx_files_user_id ON public.files(user_id);
CREATE INDEX IF NOT EXISTS idx_files_expires_at ON public.files(expires_at) WHERE expires_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_upload_tokens_token_hash ON public.upload_tokens(token_hash);
CREATE INDEX IF NOT EXISTS idx_conversion_jobs_file_id ON public.conversion_jobs(file_id);
CREATE INDEX IF NOT EXISTS idx_conversion_jobs_status ON public.conversion_jobs(status) WHERE status IN ('queued', 'running');

-- ROW LEVEL SECURITY (RLS)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.files ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.upload_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversion_jobs ENABLE ROW LEVEL SECURITY;

-- No public direct access policies. All access is handled via Next.js server with Supabase Service Role.

-- PURGE FUNCTIONS (for pg_cron or cron API route)
CREATE OR REPLACE FUNCTION public.get_expired_files_for_cleanup(batch_size INT DEFAULT 100)
RETURNS TABLE (
    file_id UUID,
    storage_key TEXT,
    pdf_key TEXT,
    docx_key TEXT,
    preview_key TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT f.id, f.storage_key, f.pdf_key, f.docx_key, f.preview_key
    FROM public.files f
    WHERE f.expires_at IS NOT NULL AND f.expires_at <= now()
    LIMIT batch_size;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Inactive users cleanup (30 days with no files and no activity)
CREATE OR REPLACE FUNCTION public.cleanup_inactive_users()
RETURNS INT AS $$
DECLARE
    deleted_count INT;
BEGIN
    WITH inactive_users AS (
        SELECT u.id
        FROM public.users u
        LEFT JOIN public.files f ON f.user_id = u.id
        WHERE u.last_active_at < (now() - INTERVAL '30 days')
        GROUP BY u.id
        HAVING COUNT(f.id) = 0
    )
    DELETE FROM public.users
    WHERE id IN (SELECT id FROM inactive_users);
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
