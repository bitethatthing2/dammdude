-- Complete Schema for NEW SIDEHUSTLE Project
-- Generated from remote database structure
-- FIXED VERSION: Handles existing tables and missing columns before adding foreign keys

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create tables
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    auth_id UUID UNIQUE,
    email TEXT NOT NULL UNIQUE,
    first_name TEXT,
    last_name TEXT,
    avatar_url TEXT,
    avatar_id UUID,
    role TEXT DEFAULT 'user',
    status TEXT DEFAULT 'active',
    is_approved BOOLEAN DEFAULT false,
    permissions JSONB DEFAULT '{}',
    location_id UUID,
    password_hash TEXT,
    last_login TIMESTAMP WITH TIME ZONE,
    blocked_at TIMESTAMP WITH TIME ZONE,
    blocked_by UUID,
    block_reason TEXT,
    notes TEXT,
    sensitive_data_encrypted JSONB,
    deleted_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Add missing columns to users table if they don't exist (for existing databases)
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS avatar_id UUID;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS blocked_by UUID;

CREATE TABLE IF NOT EXISTS public.locations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    address TEXT,
    city TEXT,
    state TEXT,
    zip TEXT,
    latitude NUMERIC NOT NULL,
    longitude NUMERIC NOT NULL,
    radius_miles NUMERIC DEFAULT 0.5,
    phone TEXT,
    email TEXT,
    website TEXT,
    deleted_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.images (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    url TEXT NOT NULL,
    name TEXT NOT NULL,
    size INTEGER,
    mime_type TEXT,
    storage_path TEXT,
    image_type TEXT,
    metadata JSONB DEFAULT '{}',
    uploaded_by UUID,
    deleted_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

CREATE TABLE IF NOT EXISTS public.announcements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    type TEXT,
    announcement_type TEXT,
    priority TEXT DEFAULT 'normal',
    active BOOLEAN DEFAULT true,
    featured_image TEXT,
    featured_image_id UUID,
    metadata JSONB DEFAULT '{}',
    send_push_notification BOOLEAN DEFAULT false,
    push_scheduled_at TIMESTAMP WITH TIME ZONE,
    push_sent_count INTEGER DEFAULT 0,
    push_failed_count INTEGER DEFAULT 0,
    created_by UUID,
    deleted_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- Add missing columns to announcements table if they don't exist
ALTER TABLE public.announcements ADD COLUMN IF NOT EXISTS created_by UUID;
ALTER TABLE public.announcements ADD COLUMN IF NOT EXISTS featured_image_id UUID;

CREATE TABLE IF NOT EXISTS public.app_config (
    key TEXT PRIMARY KEY,
    value TEXT,
    encrypted BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

CREATE TABLE IF NOT EXISTS public.admin_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    admin_id UUID,
    action TEXT NOT NULL,
    target_type TEXT,
    target_id UUID,
    details JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

CREATE TABLE IF NOT EXISTS public.content_flags (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    content_type TEXT NOT NULL,
    content_id TEXT NOT NULL,
    reason TEXT NOT NULL,
    flagged_by UUID,
    status TEXT DEFAULT 'pending',
    admin_notes TEXT,
    resolved_by UUID,
    resolved_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

CREATE TABLE IF NOT EXISTS public.device_tokens (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID,
    token TEXT NOT NULL UNIQUE,
    platform TEXT,
    device_model TEXT,
    device_name TEXT,
    app_version TEXT,
    is_active BOOLEAN DEFAULT true,
    last_used TIMESTAMP WITH TIME ZONE,
    error_count INTEGER DEFAULT 0,
    last_error TEXT,
    last_attempt_at TIMESTAMP WITH TIME ZONE,
    registration_attempts INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    recipient_id TEXT NOT NULL,
    type TEXT NOT NULL,
    message TEXT NOT NULL,
    link TEXT,
    status TEXT DEFAULT 'unread',
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

CREATE TABLE IF NOT EXISTS public.notification_preferences (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID UNIQUE,
    announcements BOOLEAN DEFAULT true,
    private_messages BOOLEAN DEFAULT true,
    chat_mentions BOOLEAN DEFAULT true,
    marketing BOOLEAN DEFAULT false,
    sound_enabled BOOLEAN DEFAULT true,
    vibration_enabled BOOLEAN DEFAULT true,
    quiet_hours_enabled BOOLEAN DEFAULT false,
    quiet_hours_start TIME,
    quiet_hours_end TIME,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

CREATE TABLE IF NOT EXISTS public.push_notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID,
    device_token_id UUID,
    announcement_id UUID,
    title TEXT NOT NULL,
    body TEXT NOT NULL,
    data JSONB DEFAULT '{}',
    status TEXT DEFAULT 'pending',
    sent_at TIMESTAMP WITH TIME ZONE,
    delivered_at TIMESTAMP WITH TIME ZONE,
    read_at TIMESTAMP WITH TIME ZONE,
    clicked_at TIMESTAMP WITH TIME ZONE,
    error_message TEXT,
    retry_count INTEGER DEFAULT 0,
    firebase_message_id TEXT
);

CREATE TABLE IF NOT EXISTS public.user_app_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID UNIQUE,
    platform TEXT,
    app_version TEXT,
    location_permission_granted BOOLEAN DEFAULT false,
    location_permission_requested_at TIMESTAMP WITH TIME ZONE,
    background_location_enabled BOOLEAN DEFAULT false,
    last_location_sync TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

CREATE TABLE IF NOT EXISTS public.user_location_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID,
    location_id UUID,
    latitude NUMERIC NOT NULL,
    longitude NUMERIC NOT NULL,
    is_at_location BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- Wolf Pack Features
CREATE TABLE IF NOT EXISTS public.wolf_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL UNIQUE,
    display_name TEXT,
    bio TEXT,
    wolf_emoji TEXT DEFAULT '🐺',
    vibe_status TEXT,
    looking_for TEXT,
    favorite_drink TEXT,
    favorite_song TEXT,
    instagram_handle TEXT,
    profile_pic_url TEXT,
    is_profile_visible BOOLEAN DEFAULT true,
    last_seen_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

CREATE TABLE IF NOT EXISTS public.wolf_pack_members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL UNIQUE,
    location_id UUID NOT NULL,
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
    last_activity TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
    status TEXT DEFAULT 'active',
    table_location TEXT,
    latitude NUMERIC,
    longitude NUMERIC
);

CREATE TABLE IF NOT EXISTS public.wolf_check_ins (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID,
    location_id UUID,
    checked_in_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
    checked_out_at TIMESTAMP WITH TIME ZONE,
    duration_minutes INTEGER
);

CREATE TABLE IF NOT EXISTS public.wolfpack_chat_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID,
    message TEXT NOT NULL,
    image_url TEXT,
    image_id UUID,
    session_id TEXT DEFAULT 'pack',
    is_admin_message BOOLEAN DEFAULT false,
    is_admin BOOLEAN DEFAULT false,
    is_deleted BOOLEAN DEFAULT false,
    flagged BOOLEAN DEFAULT false,
    flagged_by UUID,
    flagged_at TIMESTAMP WITH TIME ZONE,
    flag_reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

CREATE TABLE IF NOT EXISTS public.wolf_reactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    message_id UUID,
    user_id UUID,
    emoji TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

CREATE TABLE IF NOT EXISTS public.wolf_private_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sender_id UUID NOT NULL,
    receiver_id UUID NOT NULL,
    message TEXT NOT NULL,
    image_url TEXT,
    image_id UUID,
    is_read BOOLEAN DEFAULT false,
    read_at TIMESTAMP WITH TIME ZONE,
    is_deleted BOOLEAN DEFAULT false,
    flagged BOOLEAN DEFAULT false,
    flagged_by UUID,
    flagged_at TIMESTAMP WITH TIME ZONE,
    flag_reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

CREATE TABLE IF NOT EXISTS public.wolf_connections (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_one_id UUID,
    user_two_id UUID,
    connection_type TEXT DEFAULT 'connected',
    interaction_count INTEGER DEFAULT 0,
    last_interaction TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

CREATE TABLE IF NOT EXISTS public.wolf_pack_interactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sender_id UUID,
    receiver_id UUID,
    interaction_type TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

CREATE TABLE IF NOT EXISTS public.wolf_pack_contests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    location_id UUID,
    contest_type TEXT,
    custom_title TEXT,
    is_active BOOLEAN DEFAULT true,
    created_by UUID,
    started_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
    ends_at TIMESTAMP WITH TIME ZONE
);

CREATE TABLE IF NOT EXISTS public.wolf_pack_votes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    contest_id UUID,
    event_id UUID,
    participant_id UUID,
    voter_id UUID,
    voted_for_id UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- DJ Features
CREATE TABLE IF NOT EXISTS public.dj_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    dj_id UUID,
    location_id UUID,
    event_type TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    status TEXT DEFAULT 'pending',
    event_config JSONB DEFAULT '{}',
    started_at TIMESTAMP WITH TIME ZONE,
    ended_at TIMESTAMP WITH TIME ZONE,
    voting_ends_at TIMESTAMP WITH TIME ZONE,
    winner_id UUID,
    winner_data JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

CREATE TABLE IF NOT EXISTS public.dj_event_participants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_id UUID,
    participant_id UUID,
    participant_number INTEGER,
    metadata JSONB,
    added_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

CREATE TABLE IF NOT EXISTS public.dj_broadcasts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    dj_id UUID,
    location_id UUID,
    message TEXT NOT NULL,
    broadcast_type TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- Food & Drink Features
CREATE TABLE IF NOT EXISTS public.food_drink_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    type TEXT NOT NULL,
    description TEXT,
    icon TEXT,
    color TEXT,
    display_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_by UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

CREATE TABLE IF NOT EXISTS public.food_drink_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    description TEXT,
    category_id UUID,
    price NUMERIC NOT NULL,
    image_url TEXT,
    image_id UUID,
    available BOOLEAN DEFAULT true,
    is_available BOOLEAN DEFAULT true,
    display_order INTEGER DEFAULT 0,
    created_by UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

CREATE TABLE IF NOT EXISTS public.item_modifier_groups (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    item_id UUID,
    modifier_type TEXT NOT NULL,
    group_name TEXT,
    is_required BOOLEAN DEFAULT false,
    max_selections INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

CREATE TABLE IF NOT EXISTS public.menu_item_modifiers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    modifier_type TEXT NOT NULL,
    name TEXT NOT NULL,
    price_adjustment NUMERIC DEFAULT 0,
    is_available BOOLEAN DEFAULT true,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- Bartender Features
CREATE TABLE IF NOT EXISTS public.tables (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    section TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- FIXED: Added space between message_type and TEXT
CREATE TABLE IF NOT EXISTS public.active_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    table_id UUID,
    message_type TEXT,  -- FIXED: was "message_typeTEXT"
    metadata JSONB,
    last_activity TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

CREATE TABLE IF NOT EXISTS public.bartender_tabs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    bartender_id UUID,
    customer_name TEXT,
    status TEXT DEFAULT 'open',
    total_amount NUMERIC DEFAULT 0,
    notes TEXT,
    closed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

CREATE TABLE IF NOT EXISTS public.orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    customer_id UUID,
    table_id UUID,
    status TEXT DEFAULT 'pending',
    total_amount NUMERIC NOT NULL,
    customer_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

CREATE TABLE IF NOT EXISTS public.bartender_orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_number SERIAL,
    customer_id UUID,
    bartender_id UUID,
    location_id UUID,
    tab_id UUID,
    items JSONB NOT NULL,
    total_amount NUMERIC NOT NULL,
    order_type TEXT,
    table_location TEXT,
    status TEXT DEFAULT 'pending',
    payment_status TEXT DEFAULT 'pending',
    payment_handled_by UUID,
    customer_notes TEXT,
    bartender_notes TEXT,
    accepted_at TIMESTAMP WITH TIME ZONE,
    ready_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    paid_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

CREATE TABLE IF NOT EXISTS public.order_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID NOT NULL,
    item_id UUID NOT NULL,
    item_name TEXT NOT NULL,
    quantity INTEGER DEFAULT 1,
    price_at_order NUMERIC NOT NULL,
    customizations JSONB,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

CREATE TABLE IF NOT EXISTS public.schema_migrations (
    id SERIAL PRIMARY KEY,
    version TEXT NOT NULL,
    name TEXT NOT NULL,
    applied_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- Add Foreign Keys (with existence checks to prevent errors)
-- Only add foreign keys if both tables and columns exist
DO $$
BEGIN
    -- users.avatar_id -> images.id
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'avatar_id') 
       AND EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'images') 
       AND NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'fk_users_avatar_id') THEN
        ALTER TABLE public.users ADD CONSTRAINT fk_users_avatar_id FOREIGN KEY (avatar_id) REFERENCES public.images(id);
    END IF;

    -- users.blocked_by -> users.id
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'blocked_by') 
       AND NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'fk_users_blocked_by') THEN
        ALTER TABLE public.users ADD CONSTRAINT fk_users_blocked_by FOREIGN KEY (blocked_by) REFERENCES public.users(id);
    END IF;

    -- announcements.created_by -> users.id
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'announcements' AND column_name = 'created_by') 
       AND NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'fk_announcements_created_by') THEN
        ALTER TABLE public.announcements ADD CONSTRAINT fk_announcements_created_by FOREIGN KEY (created_by) REFERENCES public.users(id);
    END IF;

    -- announcements.featured_image_id -> images.id
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'announcements' AND column_name = 'featured_image_id') 
       AND EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'images') 
       AND NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'fk_announcements_featured_image_id') THEN
        ALTER TABLE public.announcements ADD CONSTRAINT fk_announcements_featured_image_id FOREIGN KEY (featured_image_id) REFERENCES public.images(id);
    END IF;
END $$;

-- Add remaining foreign keys (using same pattern)
ALTER TABLE public.admin_logs ADD CONSTRAINT fk_admin_logs_admin_id FOREIGN KEY (admin_id) REFERENCES public.users(id);
ALTER TABLE public.content_flags ADD CONSTRAINT fk_content_flags_flagged_by FOREIGN KEY (flagged_by) REFERENCES public.users(id);
ALTER TABLE public.content_flags ADD CONSTRAINT fk_content_flags_resolved_by FOREIGN KEY (resolved_by) REFERENCES public.users(id);
ALTER TABLE public.device_tokens ADD CONSTRAINT fk_device_tokens_user_id FOREIGN KEY (user_id) REFERENCES public.users(id);
ALTER TABLE public.notification_preferences ADD CONSTRAINT fk_notification_preferences_user_id FOREIGN KEY (user_id) REFERENCES public.users(id);
ALTER TABLE public.push_notifications ADD CONSTRAINT fk_push_notifications_user_id FOREIGN KEY (user_id) REFERENCES public.users(id);
ALTER TABLE public.push_notifications ADD CONSTRAINT fk_push_notifications_device_token_id FOREIGN KEY (device_token_id) REFERENCES public.device_tokens(id);
ALTER TABLE public.push_notifications ADD CONSTRAINT fk_push_notifications_announcement_id FOREIGN KEY (announcement_id) REFERENCES public.announcements(id);
ALTER TABLE public.user_app_settings ADD CONSTRAINT fk_user_app_settings_user_id FOREIGN KEY (user_id) REFERENCES public.users(id);
ALTER TABLE public.user_location_history ADD CONSTRAINT fk_user_location_history_user_id FOREIGN KEY (user_id) REFERENCES public.users(id);
ALTER TABLE public.user_location_history ADD CONSTRAINT fk_user_location_history_location_id FOREIGN KEY (location_id) REFERENCES public.locations(id);
ALTER TABLE public.wolf_profiles ADD CONSTRAINT fk_wolf_profiles_user_id FOREIGN KEY (user_id) REFERENCES public.users(id);
ALTER TABLE public.wolf_pack_members ADD CONSTRAINT fk_wolf_pack_members_user_id FOREIGN KEY (user_id) REFERENCES public.users(id);
ALTER TABLE public.wolf_pack_members ADD CONSTRAINT fk_wolf_pack_members_location_id FOREIGN KEY (location_id) REFERENCES public.locations(id);
ALTER TABLE public.wolf_check_ins ADD CONSTRAINT fk_wolf_check_ins_user_id FOREIGN KEY (user_id) REFERENCES public.users(id);
ALTER TABLE public.wolf_check_ins ADD CONSTRAINT fk_wolf_check_ins_location_id FOREIGN KEY (location_id) REFERENCES public.locations(id);
ALTER TABLE public.wolfpack_chat_messages ADD CONSTRAINT fk_wolfpack_chat_messages_user_id FOREIGN KEY (user_id) REFERENCES public.users(id);
ALTER TABLE public.wolfpack_chat_messages ADD CONSTRAINT fk_wolfpack_chat_messages_image_id FOREIGN KEY (image_id) REFERENCES public.images(id);
ALTER TABLE public.wolfpack_chat_messages ADD CONSTRAINT fk_wolfpack_chat_messages_flagged_by FOREIGN KEY (flagged_by) REFERENCES public.users(id);
ALTER TABLE public.wolf_reactions ADD CONSTRAINT fk_wolf_reactions_message_id FOREIGN KEY (message_id) REFERENCES public.wolfpack_chat_messages(id);
ALTER TABLE public.wolf_reactions ADD CONSTRAINT fk_wolf_reactions_user_id FOREIGN KEY (user_id) REFERENCES public.users(id);
ALTER TABLE public.wolf_private_messages ADD CONSTRAINT fk_wolf_private_messages_sender_id FOREIGN KEY (sender_id) REFERENCES public.users(id);
ALTER TABLE public.wolf_private_messages ADD CONSTRAINT fk_wolf_private_messages_receiver_id FOREIGN KEY (receiver_id) REFERENCES public.users(id);
ALTER TABLE public.wolf_private_messages ADD CONSTRAINT fk_wolf_private_messages_image_id FOREIGN KEY (image_id) REFERENCES public.images(id);
ALTER TABLE public.wolf_private_messages ADD CONSTRAINT fk_wolf_private_messages_flagged_by FOREIGN KEY (flagged_by) REFERENCES public.users(id);
ALTER TABLE public.wolf_connections ADD CONSTRAINT fk_wolf_connections_user_one_id FOREIGN KEY (user_one_id) REFERENCES public.users(id);
ALTER TABLE public.wolf_connections ADD CONSTRAINT fk_wolf_connections_user_two_id FOREIGN KEY (user_two_id) REFERENCES public.users(id);
ALTER TABLE public.wolf_pack_interactions ADD CONSTRAINT fk_wolf_pack_interactions_sender_id FOREIGN KEY (sender_id) REFERENCES public.users(id);
ALTER TABLE public.wolf_pack_interactions ADD CONSTRAINT fk_wolf_pack_interactions_receiver_id FOREIGN KEY (receiver_id) REFERENCES public.users(id);
ALTER TABLE public.wolf_pack_contests ADD CONSTRAINT fk_wolf_pack_contests_location_id FOREIGN KEY (location_id) REFERENCES public.locations(id);
ALTER TABLE public.wolf_pack_contests ADD CONSTRAINT fk_wolf_pack_contests_created_by FOREIGN KEY (created_by) REFERENCES public.users(id);
ALTER TABLE public.wolf_pack_votes ADD CONSTRAINT fk_wolf_pack_votes_contest_id FOREIGN KEY (contest_id) REFERENCES public.wolf_pack_contests(id);
ALTER TABLE public.wolf_pack_votes ADD CONSTRAINT fk_wolf_pack_votes_event_id FOREIGN KEY (event_id) REFERENCES public.dj_events(id);
ALTER TABLE public.wolf_pack_votes ADD CONSTRAINT fk_wolf_pack_votes_participant_id FOREIGN KEY (participant_id) REFERENCES public.dj_event_participants(id);
ALTER TABLE public.wolf_pack_votes ADD CONSTRAINT fk_wolf_pack_votes_voter_id FOREIGN KEY (voter_id) REFERENCES public.users(id);
ALTER TABLE public.wolf_pack_votes ADD CONSTRAINT fk_wolf_pack_votes_voted_for_id FOREIGN KEY (voted_for_id) REFERENCES public.users(id);
ALTER TABLE public.dj_events ADD CONSTRAINT fk_dj_events_dj_id FOREIGN KEY (dj_id) REFERENCES public.users(id);
ALTER TABLE public.dj_events ADD CONSTRAINT fk_dj_events_location_id FOREIGN KEY (location_id) REFERENCES public.locations(id);
ALTER TABLE public.dj_events ADD CONSTRAINT fk_dj_events_winner_id FOREIGN KEY (winner_id) REFERENCES public.users(id);
ALTER TABLE public.dj_event_participants ADD CONSTRAINT fk_dj_event_participants_event_id FOREIGN KEY (event_id) REFERENCES public.dj_events(id);
ALTER TABLE public.dj_event_participants ADD CONSTRAINT fk_dj_event_participants_participant_id FOREIGN KEY (participant_id) REFERENCES public.users(id);
ALTER TABLE public.dj_broadcasts ADD CONSTRAINT fk_dj_broadcasts_dj_id FOREIGN KEY (dj_id) REFERENCES public.users(id);
ALTER TABLE public.dj_broadcasts ADD CONSTRAINT fk_dj_broadcasts_location_id FOREIGN KEY (location_id) REFERENCES public.locations(id);
ALTER TABLE public.food_drink_categories ADD CONSTRAINT fk_food_drink_categories_created_by FOREIGN KEY (created_by) REFERENCES public.users(id);
ALTER TABLE public.food_drink_items ADD CONSTRAINT fk_food_drink_items_category_id FOREIGN KEY (category_id) REFERENCES public.food_drink_categories(id);
ALTER TABLE public.food_drink_items ADD CONSTRAINT fk_food_drink_items_image_id FOREIGN KEY (image_id) REFERENCES public.images(id);
ALTER TABLE public.food_drink_items ADD CONSTRAINT fk_food_drink_items_created_by FOREIGN KEY (created_by) REFERENCES public.users(id);
ALTER TABLE public.item_modifier_groups ADD CONSTRAINT fk_item_modifier_groups_item_id FOREIGN KEY (item_id) REFERENCES public.food_drink_items(id);
ALTER TABLE public.active_sessions ADD CONSTRAINT fk_active_sessions_table_id FOREIGN KEY (table_id) REFERENCES public.tables(id);
ALTER TABLE public.bartender_tabs ADD CONSTRAINT fk_bartender_tabs_bartender_id FOREIGN KEY (bartender_id) REFERENCES public.users(id);
ALTER TABLE public.orders ADD CONSTRAINT fk_orders_customer_id FOREIGN KEY (customer_id) REFERENCES public.users(id);
ALTER TABLE public.orders ADD CONSTRAINT fk_orders_table_id FOREIGN KEY (table_id) REFERENCES public.tables(id);
ALTER TABLE public.bartender_orders ADD CONSTRAINT fk_bartender_orders_customer_id FOREIGN KEY (customer_id) REFERENCES public.users(id);
ALTER TABLE public.bartender_orders ADD CONSTRAINT fk_bartender_orders_bartender_id FOREIGN KEY (bartender_id) REFERENCES public.users(id);
ALTER TABLE public.bartender_orders ADD CONSTRAINT fk_bartender_orders_location_id FOREIGN KEY (location_id) REFERENCES public.locations(id);
ALTER TABLE public.bartender_orders ADD CONSTRAINT fk_bartender_orders_tab_id FOREIGN KEY (tab_id) REFERENCES public.bartender_tabs(id);
ALTER TABLE public.bartender_orders ADD CONSTRAINT fk_bartender_orders_payment_handled_by FOREIGN KEY (payment_handled_by) REFERENCES public.users(id);
ALTER TABLE public.order_items ADD CONSTRAINT fk_order_items_order_id FOREIGN KEY (order_id) REFERENCES public.orders(id);
ALTER TABLE public.order_items ADD CONSTRAINT fk_order_items_item_id FOREIGN KEY (item_id) REFERENCES public.food_drink_items(id);
ALTER TABLE public.images ADD CONSTRAINT fk_images_uploaded_by FOREIGN KEY (uploaded_by) REFERENCES public.users(id);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_users_auth_id ON public.users(auth_id);
CREATE INDEX IF NOT EXISTS idx_users_role ON public.users(role);
CREATE INDEX IF NOT EXISTS idx_users_status ON public.users(status);

CREATE INDEX IF NOT EXISTS idx_wolfpack_chat_messages_created_at ON public.wolfpack_chat_messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_wolfpack_chat_messages_user_id ON public.wolfpack_chat_messages(user_id);

CREATE INDEX IF NOT EXISTS idx_wolf_private_messages_from_user ON public.wolf_private_messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_wolf_private_messages_to_user ON public.wolf_private_messages(receiver_id);
CREATE INDEX IF NOT EXISTS idx_wolf_private_messages_created_at ON public.wolf_private_messages(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_wolf_pack_members_location ON public.wolf_pack_members(location_id);
CREATE INDEX IF NOT EXISTS idx_wolf_pack_members_user ON public.wolf_pack_members(user_id);

CREATE INDEX IF NOT EXISTS idx_bartender_orders_status ON public.bartender_orders(status);
CREATE INDEX IF NOT EXISTS idx_bartender_orders_created_at ON public.bartender_orders(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_device_tokens_user ON public.device_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_device_tokens_token ON public.device_tokens(token);

-- Enable Row Level Security
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.app_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.content_flags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.device_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.push_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_app_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_location_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wolf_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wolf_pack_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wolf_check_ins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wolfpack_chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wolf_reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wolf_private_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wolf_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wolf_pack_interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wolf_pack_contests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wolf_pack_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dj_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dj_event_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dj_broadcasts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.food_drink_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.food_drink_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.item_modifier_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.menu_item_modifiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tables ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.active_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bartender_tabs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bartender_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

-- Basic RLS Policies (you'll need to add more based on your app's needs)
-- Allow authenticated users to read their own data
CREATE POLICY "Users can view own profile" ON public.users
    FOR SELECT USING (auth.uid() = auth_id);

CREATE POLICY "Users can update own profile" ON public.users
    FOR UPDATE USING (auth.uid() = auth_id);

-- Allow public read access to certain tables
CREATE POLICY "Public can view locations" ON public.locations
    FOR SELECT USING (true);

CREATE POLICY "Public can view announcements" ON public.announcements
    FOR SELECT USING (active = true AND deleted_at IS NULL);

CREATE POLICY "Public can view menu categories" ON public.food_drink_categories
    FOR SELECT USING (is_active = true);

CREATE POLICY "Public can view menu items" ON public.food_drink_items
    FOR SELECT USING (is_available = true);

-- Wolf Pack Members can see each other
CREATE POLICY "Pack members can view other members" ON public.wolf_pack_members
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.wolf_pack_members wpm
            WHERE wpm.user_id = auth.uid()::uuid
            AND wpm.location_id = wolf_pack_members.location_id
        )
    );

-- Users can manage their own data
CREATE POLICY "Users can manage own wolf profile" ON public.wolf_profiles
    FOR ALL USING (auth.uid()::uuid = user_id);

CREATE POLICY "Users can manage own device tokens" ON public.device_tokens
    FOR ALL USING (auth.uid()::uuid = user_id);

CREATE POLICY "Users can manage own notifications" ON public.notification_preferences
    FOR ALL USING (auth.uid()::uuid = user_id);

-- Add more policies as needed for your specific requirements

-- Create a trigger to update the updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc'::text, NOW());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply the trigger to tables with updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_locations_updated_at BEFORE UPDATE ON public.locations
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_announcements_updated_at BEFORE UPDATE ON public.announcements
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_food_drink_categories_updated_at BEFORE UPDATE ON public.food_drink_categories
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_food_drink_items_updated_at BEFORE UPDATE ON public.food_drink_items
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Grant permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO anon, authenticated;

