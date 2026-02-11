
-- -----------------------------------------------------------------------------
-- LingoFlow Database Schema - Strict CEFR Progression & Unique Vocabulary
-- -----------------------------------------------------------------------------

-- 1. Reset (For clean setup)
DROP FUNCTION IF EXISTS public.submit_correct_sentence;
DROP TRIGGER IF EXISTS on_progress_update ON public.user_progress;
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user;
DROP FUNCTION IF EXISTS public.check_level_up;
DROP TRIGGER IF EXISTS on_auth_user_created_confirm ON auth.users;
DROP FUNCTION IF EXISTS public.auto_confirm_admin;
DROP FUNCTION IF EXISTS public.auto_confirm_user; -- Renamed for clarity
DROP TABLE IF EXISTS public.interactions;
DROP TABLE IF EXISTS public.learning_sessions;
DROP TABLE IF EXISTS public.user_vocabulary;
DROP TABLE IF EXISTS public.user_progress;
DROP TABLE IF EXISTS public.profiles;
DROP TABLE IF EXISTS public.cefr_rules;
DROP TYPE IF EXISTS public.cefr_level;
DROP TYPE IF EXISTS public.user_tier;

CREATE TYPE public.user_tier AS ENUM ('free', 'pro');
CREATE TYPE public.cefr_level AS ENUM ('A1', 'A2', 'B1', 'B2', 'C1', 'C2');

-- -----------------------------------------------------------------------------
-- 2. Configuration Table: CEFR Rules
-- -----------------------------------------------------------------------------
CREATE TABLE public.cefr_rules (
    level_code public.cefr_level PRIMARY KEY,
    description TEXT NOT NULL,
    words_required INTEGER NOT NULL -- Cumulative UNIQUE words needed
);

ALTER TABLE public.cefr_rules ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read rules" ON public.cefr_rules FOR SELECT USING (true);

-- Seed Data
INSERT INTO public.cefr_rules (level_code, description, words_required) VALUES
('A1', 'Iniciante', 700),
('A2', 'Elementar', 1500),
('B1', 'Intermediário', 2500),
('B2', 'Intermediário Superior', 4500),
('C1', 'Avançado', 8000),
('C2', 'Proficiente', 10000);

-- -----------------------------------------------------------------------------
-- 3. Core Tables
-- -----------------------------------------------------------------------------

-- Profiles (Extended)
CREATE TABLE public.profiles (
    id UUID NOT NULL PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT,
    full_name TEXT,
    about_me TEXT,
    profession TEXT,
    address TEXT,
    phone TEXT,
    subscription_tier public.user_tier NOT NULL DEFAULT 'free',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- User Vocabulary (The Inventory of learned words)
CREATE TABLE public.user_vocabulary (
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    word TEXT NOT NULL,
    first_spoken_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    PRIMARY KEY (user_id, word)
);

-- User Progress (The Scoreboard)
CREATE TABLE public.user_progress (
    user_id UUID NOT NULL PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
    current_level public.cefr_level NOT NULL DEFAULT 'A1' REFERENCES public.cefr_rules(level_code),
    total_unique_words INTEGER NOT NULL DEFAULT 0,
    words_to_next_level INTEGER NOT NULL DEFAULT 700,
    last_updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Sessions
CREATE TABLE public.learning_sessions (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    topic TEXT NOT NULL,
    target_level public.cefr_level NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Interactions (Notes/Chat History)
CREATE TABLE public.interactions (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    session_id UUID NOT NULL REFERENCES public.learning_sessions(id) ON DELETE CASCADE,
    user_text_transcribed TEXT,
    ai_response_text TEXT,
    final_score INTEGER,
    new_words_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- -----------------------------------------------------------------------------
-- 4. Security (Row Level Security) - DATA ISOLATION
-- -----------------------------------------------------------------------------

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_vocabulary ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE learning_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE interactions ENABLE ROW LEVEL SECURITY;

-- Profiles: Users can only see their own profile
CREATE POLICY "Users view own profile" ON profiles 
    FOR SELECT USING (auth.uid() = id);

-- Profiles: Users can update their own profile
CREATE POLICY "Users update own profile" ON profiles 
    FOR UPDATE USING (auth.uid() = id);

-- Vocabulary: Users can only see their own words
CREATE POLICY "Users view own vocabulary" ON user_vocabulary 
    FOR SELECT USING (auth.uid() = user_id);

-- Progress: Users can only see their own stats
CREATE POLICY "Users view own progress" ON user_progress 
    FOR SELECT USING (auth.uid() = user_id);

-- Sessions: Users can only see and create their own sessions
CREATE POLICY "Users view own sessions" ON learning_sessions 
    FOR SELECT USING (auth.uid() = user_id);
    
CREATE POLICY "Users insert own sessions" ON learning_sessions 
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Interactions: Users can only see/add interactions for THEIR own sessions
CREATE POLICY "Users view own interactions" ON interactions 
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM learning_sessions 
            WHERE id = interactions.session_id 
            AND user_id = auth.uid()
        )
    );

CREATE POLICY "Users insert own interactions" ON interactions 
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM learning_sessions 
            WHERE id = interactions.session_id 
            AND user_id = auth.uid()
        )
    );

-- -----------------------------------------------------------------------------
-- 5. Automation & Logic
-- -----------------------------------------------------------------------------

-- Trigger 1: Automatically setup profile/progress when a user Signs Up
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email) VALUES (new.id, new.email);
    INSERT INTO public.user_progress (user_id, current_level, total_unique_words, words_to_next_level)
    VALUES (new.id, 'A1', 0, 700);
    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Trigger 2: Auto-Confirm Email for ALL Users (No email verification required flow)
CREATE OR REPLACE FUNCTION public.auto_confirm_user()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE auth.users SET email_confirmed_at = now() WHERE id = new.id;
    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created_confirm
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.auto_confirm_user();


-- RPC: Securely process text, extract words, and update level
CREATE OR REPLACE FUNCTION public.submit_correct_sentence(p_text text)
RETURNS json AS $$
DECLARE
    v_user_id uuid := auth.uid();
    v_word text;
    v_words text[];
    v_new_words_count int := 0;
    v_total_unique int;
    v_current_level public.cefr_level;
    v_next_level_req int;
    v_level_code public.cefr_level;
BEGIN
    -- Security Check
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Not authenticated';
    END IF;

    -- 1. Tokenize (Simple regex to extract words, lowercase)
    SELECT array_agg(DISTINCT lower(m[1])) INTO v_words
    FROM regexp_matches(p_text, '([a-zA-Z]+)', 'g') m;

    -- 2. Insert unique words
    IF v_words IS NOT NULL THEN
        FOREACH v_word IN ARRAY v_words
        LOOP
            IF length(v_word) > 1 THEN
                INSERT INTO public.user_vocabulary (user_id, word)
                VALUES (v_user_id, v_word)
                ON CONFLICT (user_id, word) DO NOTHING;
                
                IF found THEN
                    v_new_words_count := v_new_words_count + 1;
                END IF;
            END IF;
        END LOOP;
    END IF;

    -- 3. Calculate Totals
    SELECT count(*) INTO v_total_unique FROM public.user_vocabulary WHERE user_id = v_user_id;

    -- 4. Determine Level
    v_level_code := 'A1';
    IF v_total_unique >= 10000 THEN v_level_code := 'C2';
    ELSIF v_total_unique >= 8000 THEN v_level_code := 'C1';
    ELSIF v_total_unique >= 4500 THEN v_level_code := 'B2';
    ELSIF v_total_unique >= 2500 THEN v_level_code := 'B1';
    ELSIF v_total_unique >= 1500 THEN v_level_code := 'A2';
    ELSE v_level_code := 'A1';
    END IF;

    -- 5. Get Next Level Requirement
    SELECT words_required INTO v_next_level_req 
    FROM public.cefr_rules 
    WHERE words_required > v_total_unique 
    ORDER BY words_required ASC 
    LIMIT 1;

    IF v_next_level_req IS NULL THEN v_next_level_req := 10000; END IF;

    -- 6. Update Progress Table
    UPDATE public.user_progress
    SET 
        total_unique_words = v_total_unique,
        current_level = v_level_code,
        words_to_next_level = v_next_level_req,
        last_updated_at = now()
    WHERE user_id = v_user_id;

    RETURN json_build_object(
        'new_words_count', v_new_words_count,
        'total_unique_words', v_total_unique,
        'current_level', v_level_code,
        'words_to_next_level', v_next_level_req
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
