-- Migration 00003: Add support for links/URLs in files table

-- 1. Allow 'link' as a valid file kind
ALTER TABLE public.files DROP CONSTRAINT IF EXISTS files_kind_check;
ALTER TABLE public.files ADD CONSTRAINT files_kind_check 
    CHECK (kind IN ('document', 'image', 'archive', 'link'));

-- 2. Add url column for external task links (Google Drive, Canva, Docs, Figma, etc.)
ALTER TABLE public.files ADD COLUMN IF NOT EXISTS url TEXT;

-- 3. Allow storage_key to be nullable (links do not consume storage bucket space)
ALTER TABLE public.files ALTER COLUMN storage_key DROP NOT NULL;

-- 4. Set sensible defaults for links
ALTER TABLE public.files ALTER COLUMN size_bytes SET DEFAULT 0;
ALTER TABLE public.files ALTER COLUMN ext SET DEFAULT 'link';
ALTER TABLE public.files ALTER COLUMN mime SET DEFAULT 'text/uri-list';
