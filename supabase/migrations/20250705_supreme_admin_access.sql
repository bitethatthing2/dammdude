-- =====================================================
-- SUPREME ADMIN ACCESS FOR mkahler599@gmail.com
-- Grant unrestricted access to everything
-- =====================================================

-- Ensure the supreme admin user exists and has all privileges
INSERT INTO users (
    auth_id,
    email, 
    first_name,
    last_name,
    display_name,
    role,
    permissions,
    is_wolfpack_member,
    wolfpack_status,
    is_vip,
    is_dj,
    location_preference
) VALUES (
    (SELECT id FROM auth.users WHERE email = 'mkahler599@gmail.com'),
    'mkahler599@gmail.com',
    'Michael',
    'Kahler', 
    'Supreme Admin',
    'supreme_admin',
    jsonb_build_object(
        'super_admin', true,
        'can_access_all', true,
        'can_edit_all', true,
        'can_delete_all', true,
        'bypass_rls', true,
        'admin_override', true,
        'supreme_access', true
    ),
    true,
    'supreme',
    true,
    true,
    'both'
) ON CONFLICT (email) DO UPDATE SET
    role = 'supreme_admin',
    permissions = jsonb_build_object(
        'super_admin', true,
        'can_access_all', true,
        'can_edit_all', true,
        'can_delete_all', true,
        'bypass_rls', true,
        'admin_override', true,
        'supreme_access', true
    ),
    is_wolfpack_member = true,
    wolfpack_status = 'supreme',
    is_vip = true,
    is_dj = true,
    location_preference = 'both';

-- =====================================================
-- SUPREME ADMIN RLS POLICIES - UNRESTRICTED ACCESS
-- =====================================================

-- Drop all restrictive policies and create supreme admin override policies

-- DJ BROADCASTS - Supreme admin can do anything
DROP POLICY IF EXISTS "DJs can manage broadcasts" ON dj_broadcasts;
DROP POLICY IF EXISTS "Temp - All authenticated users can manage broadcasts" ON dj_broadcasts;
CREATE POLICY "Supreme admin unrestricted dj_broadcasts" ON dj_broadcasts
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE auth_id = auth.uid() 
            AND (
                email = 'mkahler599@gmail.com' 
                OR role = 'supreme_admin'
                OR (permissions->>'super_admin')::boolean = true
            )
        )
        OR
        EXISTS (SELECT 1 FROM users WHERE auth_id = auth.uid() AND role IN ('dj', 'admin'))
    );

-- DJ DASHBOARD STATE - Supreme admin access
DROP POLICY IF EXISTS "DJs can manage their dashboard state" ON dj_dashboard_state;
DROP POLICY IF EXISTS "Temp - Users can manage dashboard state" ON dj_dashboard_state;
CREATE POLICY "Supreme admin unrestricted dashboard_state" ON dj_dashboard_state
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE auth_id = auth.uid() 
            AND (
                email = 'mkahler599@gmail.com' 
                OR role = 'supreme_admin'
                OR (permissions->>'super_admin')::boolean = true
            )
        )
        OR
        dj_id IN (SELECT id FROM users WHERE auth_id = auth.uid()) 
        OR 
        EXISTS (SELECT 1 FROM users WHERE auth_id = auth.uid() AND role = 'admin')
    );

-- DJ EVENTS - Supreme admin access  
DROP POLICY IF EXISTS "DJs can manage events" ON dj_events;
DROP POLICY IF EXISTS "Temp - Users can manage events" ON dj_events;
CREATE POLICY "Supreme admin unrestricted dj_events" ON dj_events
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE auth_id = auth.uid() 
            AND (
                email = 'mkahler599@gmail.com' 
                OR role = 'supreme_admin'
                OR (permissions->>'super_admin')::boolean = true
            )
        )
        OR
        EXISTS (SELECT 1 FROM users WHERE auth_id = auth.uid() AND role IN ('dj', 'admin'))
    );

-- DJ BROADCAST TEMPLATES - Supreme admin access
DROP POLICY IF EXISTS "DJs can manage templates" ON dj_broadcast_templates;
DROP POLICY IF EXISTS "Temp - Users can manage templates" ON dj_broadcast_templates;
CREATE POLICY "Supreme admin unrestricted broadcast_templates" ON dj_broadcast_templates
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE auth_id = auth.uid() 
            AND (
                email = 'mkahler599@gmail.com' 
                OR role = 'supreme_admin'
                OR (permissions->>'super_admin')::boolean = true
            )
        )
        OR
        dj_id IN (SELECT id FROM users WHERE auth_id = auth.uid()) 
        OR 
        EXISTS (SELECT 1 FROM users WHERE auth_id = auth.uid() AND role = 'admin')
    );

DROP POLICY IF EXISTS "DJs can view all templates" ON dj_broadcast_templates;
DROP POLICY IF EXISTS "Temp - Users can view templates" ON dj_broadcast_templates;
CREATE POLICY "Supreme admin view all broadcast_templates" ON dj_broadcast_templates
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE auth_id = auth.uid() 
            AND (
                email = 'mkahler599@gmail.com' 
                OR role = 'supreme_admin'
                OR (permissions->>'super_admin')::boolean = true
            )
        )
        OR
        EXISTS (SELECT 1 FROM users WHERE auth_id = auth.uid() AND role IN ('dj', 'admin'))
    );

-- DJ EVENT TEMPLATES - Supreme admin access
DROP POLICY IF EXISTS "DJs can create templates" ON dj_event_templates;
DROP POLICY IF EXISTS "Temp - Users can create templates" ON dj_event_templates;
CREATE POLICY "Supreme admin unrestricted event_templates" ON dj_event_templates
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE auth_id = auth.uid() 
            AND (
                email = 'mkahler599@gmail.com' 
                OR role = 'supreme_admin'
                OR (permissions->>'super_admin')::boolean = true
            )
        )
        OR
        EXISTS (SELECT 1 FROM users WHERE auth_id = auth.uid() AND role IN ('dj', 'admin'))
    );

-- DJ ANALYTICS - Supreme admin access
DROP POLICY IF EXISTS "DJs can view their analytics" ON dj_analytics;
DROP POLICY IF EXISTS "Temp - Users can view analytics" ON dj_analytics;
CREATE POLICY "Supreme admin unrestricted analytics" ON dj_analytics
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE auth_id = auth.uid() 
            AND (
                email = 'mkahler599@gmail.com' 
                OR role = 'supreme_admin'
                OR (permissions->>'super_admin')::boolean = true
            )
        )
        OR
        dj_id IN (SELECT id FROM users WHERE auth_id = auth.uid()) 
        OR 
        EXISTS (SELECT 1 FROM users WHERE auth_id = auth.uid() AND role = 'admin')
    );

-- DJ EVENT PARTICIPANTS - Supreme admin access
DROP POLICY IF EXISTS "DJs can manage participants" ON dj_event_participants;
DROP POLICY IF EXISTS "Temp - Users can manage participants" ON dj_event_participants;
CREATE POLICY "Supreme admin unrestricted event_participants" ON dj_event_participants
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE auth_id = auth.uid() 
            AND (
                email = 'mkahler599@gmail.com' 
                OR role = 'supreme_admin'
                OR (permissions->>'super_admin')::boolean = true
            )
        )
        OR
        EXISTS (SELECT 1 FROM users WHERE auth_id = auth.uid() AND role IN ('dj', 'admin'))
    );

-- =====================================================
-- ADDITIONAL SUPREME ADMIN POLICIES FOR OTHER TABLES
-- =====================================================

-- USERS table - Supreme admin can manage all users
DROP POLICY IF EXISTS "Users can view public profiles" ON users;
CREATE POLICY "Supreme admin unrestricted users" ON users
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE auth_id = auth.uid() 
            AND (
                email = 'mkahler599@gmail.com' 
                OR role = 'supreme_admin'
                OR (permissions->>'super_admin')::boolean = true
            )
        )
        OR
        id IN (SELECT id FROM users WHERE auth_id = auth.uid())
        OR
        NOT is_private
    );

-- ORDERS table - Supreme admin can see all orders
CREATE POLICY "Supreme admin unrestricted orders" ON orders
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE auth_id = auth.uid() 
            AND (
                email = 'mkahler599@gmail.com' 
                OR role = 'supreme_admin'
                OR (permissions->>'super_admin')::boolean = true
            )
        )
        OR
        user_id IN (SELECT id FROM users WHERE auth_id = auth.uid())
    );

-- =====================================================
-- CREATE DIAGNOSTIC VIEW FOR SUPREME ADMIN
-- =====================================================

CREATE OR REPLACE VIEW supreme_admin_diagnostic AS
SELECT 
    u.id,
    u.email,
    u.role,
    u.permissions,
    au.email as auth_email,
    au.last_sign_in_at,
    CASE 
        WHEN u.email = 'mkahler599@gmail.com' THEN 'SUPREME_ACCESS'
        WHEN u.role = 'supreme_admin' THEN 'ADMIN_ACCESS' 
        WHEN u.role = 'dj' THEN 'DJ_ACCESS'
        ELSE 'LIMITED_ACCESS'
    END as access_level,
    CASE 
        WHEN u.email = 'mkahler599@gmail.com' THEN true
        WHEN (u.permissions->>'super_admin')::boolean = true THEN true
        WHEN u.role IN ('supreme_admin', 'admin', 'dj') THEN true
        ELSE false
    END as can_use_dj_features
FROM users u
LEFT JOIN auth.users au ON u.auth_id = au.id
WHERE u.auth_id = auth.uid();

GRANT SELECT ON supreme_admin_diagnostic TO authenticated;

-- =====================================================
-- ENSURE FUNCTION PERMISSIONS FOR SUPREME ADMIN
-- =====================================================

-- Grant all function permissions to authenticated users (supreme admin included)
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO authenticated;

-- Specifically ensure DJ functions are available
GRANT EXECUTE ON FUNCTION get_dj_dashboard_analytics TO authenticated;
GRANT EXECUTE ON FUNCTION dj_broadcast_message TO authenticated;
GRANT EXECUTE ON FUNCTION record_broadcast_response TO authenticated;
GRANT EXECUTE ON FUNCTION get_broadcast_results TO authenticated;
GRANT EXECUTE ON FUNCTION create_dj_event TO authenticated;
GRANT EXECUTE ON FUNCTION close_dj_event TO authenticated;
GRANT EXECUTE ON FUNCTION create_broadcast_from_template TO authenticated;