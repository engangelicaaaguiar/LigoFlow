-- -----------------------------------------------------------------------------
-- LingoFlow Database Schema
-- -----------------------------------------------------------------------------

-- 1. Create Custom Types
-- Enum for user tiers to enforce valid values at the database level
CREATE TYPE public.user_tier AS ENUM ('free', 'pro');

-- -----------------------------------------------------------------------------
-- 2. Create Tables
-- -----------------------------------------------------------------------------

-- Table: profiles
-- Extends the default auth.users table with application-specific data.
CREATE TABLE public.profiles (
    id UUID NOT NULL PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT,
    tier public.user_tier NOT NULL DEFAULT 'free',
    total_xp INTEGER NOT NULL DEFAULT 0,
    daily_usage_count INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Table: conversations
-- Groups messages into logical sessions/topics.
CREATE TABLE public.conversations (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    topic TEXT, -- Optional topic/summary of the conversation
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Table: messages
-- Stores individual chat turns, audio references, and AI feedback.
CREATE TABLE public.messages (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
    content TEXT NOT NULL,
    audio_url TEXT, -- URL to the audio file in storage bucket
    grammar_score INTEGER, -- Score 1-10 given by Gemini
    correction_json JSONB, -- Structured correction data
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT timezone('utc'::text, now())
);

-- -----------------------------------------------------------------------------
-- 3. Enable Row Level Security (RLS)
-- -----------------------------------------------------------------------------

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- -----------------------------------------------------------------------------
-- 4. RLS Policies
-- -----------------------------------------------------------------------------

-- Profiles Policies
-- Users can read their own profile.
CREATE POLICY "Users can view own profile" ON public.profiles
    FOR SELECT USING (auth.uid() = id);

-- Users can update their own profile (Note: Critical logic like XP typically handled by Server Actions/Service Role).
CREATE POLICY "Users can update own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = id);

-- Conversations Policies
-- Users can read their own conversations.
CREATE POLICY "Users can view own conversations" ON public.conversations
    FOR SELECT USING (auth.uid() = user_id);

-- Users can create conversations for themselves.
CREATE POLICY "Users can insert own conversations" ON public.conversations
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update/delete their own conversations.
CREATE POLICY "Users can update own conversations" ON public.conversations
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own conversations" ON public.conversations
    FOR DELETE USING (auth.uid() = user_id);

-- Messages Policies
-- Users can view messages if they own the parent conversation.
CREATE POLICY "Users can view own conversation messages" ON public.messages
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.conversations
            WHERE conversations.id = messages.conversation_id
            AND conversations.user_id = auth.uid()
        )
    );

-- Users can insert messages into conversations they own.
CREATE POLICY "Users can insert messages into own conversations" ON public.messages
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.conversations
            WHERE conversations.id = conversation_id
            AND conversations.user_id = auth.uid()
        )
    );

-- -----------------------------------------------------------------------------
-- 5. Automations (Triggers & Functions)
-- -----------------------------------------------------------------------------

-- Function to handle new user signup via Supabase Auth
-- SECURITY DEFINER: Runs with elevated privileges to insert into public.profiles
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, tier, total_xp, daily_usage_count)
    VALUES (
        new.id,
        new.email,
        'free',
        0,
        0
    );
    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to execute the function after a row is inserted into auth.users
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- -----------------------------------------------------------------------------
-- 6. Indexes for Performance
-- -----------------------------------------------------------------------------

CREATE INDEX idx_conversations_user_id ON public.conversations(user_id);
CREATE INDEX idx_messages_conversation_id ON public.messages(conversation_id);
