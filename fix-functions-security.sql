-- Fix Function Security - Safe Version
-- This script only fixes functions that actually exist

-- Check and fix only the functions that exist
-- We'll use a safer approach that won't fail if functions don't exist

-- Try to fix each function individually
-- If a function doesn't exist, it will just skip it

DO $$
BEGIN
    -- Try to fix cleanup_expired_tokens function
    BEGIN
        ALTER FUNCTION public.cleanup_expired_tokens() SET search_path = '';
        RAISE NOTICE 'Fixed cleanup_expired_tokens function';
    EXCEPTION
        WHEN undefined_function THEN
            RAISE NOTICE 'cleanup_expired_tokens function does not exist, skipping';
    END;

    -- Try to fix log_consent_change function
    BEGIN
        ALTER FUNCTION public.log_consent_change(TEXT, TEXT, TEXT) SET search_path = '';
        RAISE NOTICE 'Fixed log_consent_change function';
    EXCEPTION
        WHEN undefined_function THEN
            RAISE NOTICE 'log_consent_change function does not exist, skipping';
    END;

    -- Try to fix log_data_access function
    BEGIN
        ALTER FUNCTION public.log_data_access(TEXT, TEXT, TEXT) SET search_path = '';
        RAISE NOTICE 'Fixed log_data_access function';
    EXCEPTION
        WHEN undefined_function THEN
            RAISE NOTICE 'log_data_access function does not exist, skipping';
    END;

    -- Try to fix get_usage_summary function
    BEGIN
        ALTER FUNCTION public.get_usage_summary(TEXT, TIMESTAMP WITH TIME ZONE, TIMESTAMP WITH TIME ZONE) SET search_path = '';
        RAISE NOTICE 'Fixed get_usage_summary function';
    EXCEPTION
        WHEN undefined_function THEN
            RAISE NOTICE 'get_usage_summary function does not exist, skipping';
    END;

    -- Try to fix calculate_level_from_xp function
    BEGIN
        ALTER FUNCTION public.calculate_level_from_xp(INTEGER) SET search_path = '';
        RAISE NOTICE 'Fixed calculate_level_from_xp function';
    EXCEPTION
        WHEN undefined_function THEN
            RAISE NOTICE 'calculate_level_from_xp function does not exist, skipping';
    END;

    -- Try to fix check_achievements function
    BEGIN
        ALTER FUNCTION public.check_achievements(UUID) SET search_path = '';
        RAISE NOTICE 'Fixed check_achievements function';
    EXCEPTION
        WHEN undefined_function THEN
            RAISE NOTICE 'check_achievements function does not exist, skipping';
    END;

    -- Try to fix award_xp function
    BEGIN
        ALTER FUNCTION public.award_xp(UUID, INTEGER, VARCHAR(50), UUID, VARCHAR(50), TEXT) SET search_path = '';
        RAISE NOTICE 'Fixed award_xp function';
    EXCEPTION
        WHEN undefined_function THEN
            RAISE NOTICE 'award_xp function does not exist, skipping';
    END;

    -- Try to fix update_users_updated_at function
    BEGIN
        ALTER FUNCTION public.update_users_updated_at() SET search_path = '';
        RAISE NOTICE 'Fixed update_users_updated_at function';
    EXCEPTION
        WHEN undefined_function THEN
            RAISE NOTICE 'update_users_updated_at function does not exist, skipping';
    END;

    RAISE NOTICE 'Function security check completed successfully!';
END $$;
