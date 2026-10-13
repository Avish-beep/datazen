-- Supabase Initial Schema for DataZen
-- Enables UUID generation and time functions

-- 1. PROFILES TABLE
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 2. DEVICES TABLE
CREATE TABLE IF NOT EXISTS public.devices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    device_name TEXT NOT NULL,
    platform TEXT NOT NULL DEFAULT 'android',
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    last_seen_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 3. QUOTA_SETTINGS TABLE
CREATE TABLE IF NOT EXISTS public.quota_settings (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    daily_limit_mb NUMERIC NOT NULL DEFAULT 1500, -- default 1.5 GB
    monthly_limit_mb NUMERIC NOT NULL DEFAULT 45000, -- default 45 GB
    alert_time TEXT NOT NULL DEFAULT '20:00',
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 4. DAILY_USAGE TABLE
CREATE TABLE IF NOT EXISTS public.daily_usage (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    device_id UUID NOT NULL REFERENCES public.devices(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    total_mb NUMERIC NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT uq_daily_usage_device_date UNIQUE (device_id, date)
);

-- 5. APP_USAGE TABLE
CREATE TABLE IF NOT EXISTS public.app_usage (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    device_id UUID NOT NULL REFERENCES public.devices(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    app_name TEXT NOT NULL,
    package_name TEXT NOT NULL,
    used_mb NUMERIC NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT uq_app_usage_device_date_pkg UNIQUE (device_id, date, package_name)
);

-- 6. RATE LIMITS TABLE (for Vercel serverless rate limiting)
CREATE TABLE IF NOT EXISTS public.rate_limits (
    key TEXT PRIMARY KEY,
    points INTEGER NOT NULL DEFAULT 1,
    expire_at TIMESTAMPTZ NOT NULL
);

-- Index for pruning expired rate limits
CREATE INDEX IF NOT EXISTS idx_rate_limits_expire ON public.rate_limits(expire_at);

-- Postgres Function for Atomic Rate Limiting
-- Returns TRUE if allowed, FALSE if exceeded
CREATE OR REPLACE FUNCTION public.check_rate_limit(
    p_key TEXT,
    p_max_points INTEGER,
    p_window_seconds INTEGER
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_now TIMESTAMPTZ := timezone('utc'::text, now());
    v_expire TIMESTAMPTZ := v_now + (p_window_seconds || ' seconds')::INTERVAL;
    v_current_points INTEGER;
BEGIN
    -- Delete expired records for this key
    DELETE FROM public.rate_limits WHERE expire_at < v_now;

    INSERT INTO public.rate_limits (key, points, expire_at)
    VALUES (p_key, 1, v_expire)
    ON CONFLICT (key) DO UPDATE
    SET points = public.rate_limits.points + 1
    WHERE public.rate_limits.expire_at >= v_now
    RETURNING points INTO v_current_points;

    IF v_current_points IS NULL THEN
        -- Was expired and conflict didn't update: reset
        INSERT INTO public.rate_limits (key, points, expire_at)
        VALUES (p_key, 1, v_expire)
        ON CONFLICT (key) DO UPDATE
        SET points = 1, expire_at = v_expire
        RETURNING points INTO v_current_points;
    END IF;

    IF v_current_points > p_max_points THEN
        RETURN FALSE;
    END IF;

    RETURN TRUE;
END;
$$;

-- INDEXES for common queries (user_id + date)
CREATE INDEX IF NOT EXISTS idx_devices_user_id ON public.devices(user_id);
CREATE INDEX IF NOT EXISTS idx_daily_usage_user_date ON public.daily_usage(user_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_daily_usage_device_date ON public.daily_usage(device_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_app_usage_user_date ON public.app_usage(user_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_app_usage_device_date ON public.app_usage(device_id, date DESC);

-- ENABLE ROW LEVEL SECURITY ON ALL TABLES
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quota_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.app_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rate_limits ENABLE ROW LEVEL SECURITY;

-- ROW LEVEL SECURITY POLICIES
-- Profiles
CREATE POLICY "Users can view their own profile"
    ON public.profiles FOR SELECT
    USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
    ON public.profiles FOR UPDATE
    USING (auth.uid() = id);

-- Devices
CREATE POLICY "Users can view their own devices"
    ON public.devices FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own devices"
    ON public.devices FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own devices"
    ON public.devices FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own devices"
    ON public.devices FOR DELETE
    USING (auth.uid() = user_id);

-- Quota Settings
CREATE POLICY "Users can view their own quota settings"
    ON public.quota_settings FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own quota settings"
    ON public.quota_settings FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own quota settings"
    ON public.quota_settings FOR UPDATE
    USING (auth.uid() = user_id);

-- Daily Usage
CREATE POLICY "Users can view their own daily usage"
    ON public.daily_usage FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own daily usage"
    ON public.daily_usage FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own daily usage"
    ON public.daily_usage FOR UPDATE
    USING (auth.uid() = user_id);

-- App Usage
CREATE POLICY "Users can view their own app usage"
    ON public.app_usage FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own app usage"
    ON public.app_usage FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own app usage"
    ON public.app_usage FOR UPDATE
    USING (auth.uid() = user_id);

-- SIGNUP TRIGGER: Automatically create profile and quota_settings for new auth users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    INSERT INTO public.profiles (id, full_name, created_at)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', ''),
        timezone('utc'::text, now())
    )
    ON CONFLICT (id) DO NOTHING;

    INSERT INTO public.quota_settings (user_id, daily_limit_mb, monthly_limit_mb, alert_time, updated_at)
    VALUES (
        NEW.id,
        1500,
        45000,
        '20:00',
        timezone('utc'::text, now())
    )
    ON CONFLICT (user_id) DO NOTHING;

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();
