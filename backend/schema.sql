-- SnapCook AI Database Schema
-- Run this in your Supabase SQL Editor

-- Enable UUID generation extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS public.recipes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NULL REFERENCES auth.users(id) ON DELETE SET NULL,
    image_url TEXT NULL,
    recipe_data JSONB NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for fast queries by user_id and creation time
CREATE INDEX IF NOT EXISTS idx_recipes_user_id ON public.recipes(user_id);
CREATE INDEX IF NOT EXISTS idx_recipes_created_at ON public.recipes(created_at DESC);

-- Enable Row Level Security (RLS)
ALTER TABLE public.recipes ENABLE ROW LEVEL SECURITY;

-- Policy: Allow anonymous/authenticated inserts (for demo & MVP flexibility)
CREATE POLICY "Allow public insert on recipes"
    ON public.recipes
    FOR INSERT
    WITH CHECK (true);

-- Policy: Allow reading recipes
CREATE POLICY "Allow public select on recipes"
    ON public.recipes
    FOR SELECT
    USING (true);
