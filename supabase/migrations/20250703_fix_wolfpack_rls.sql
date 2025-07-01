-- Fix RLS policies for Wolf Pack features
-- Add missing RLS policies for wolf_pack_interactions and wolf_private_messages

-- Allow authenticated users to view their own interactions
CREATE POLICY "Users can view own pack interactions" ON public.wolf_pack_interactions
    FOR SELECT USING (
        auth.uid()::uuid = sender_id OR 
        auth.uid()::uuid = receiver_id
    );

-- Allow authenticated users to create pack interactions
CREATE POLICY "Users can create pack interactions" ON public.wolf_pack_interactions
    FOR INSERT WITH CHECK (auth.uid()::uuid = sender_id);

-- Allow users to manage their own private messages
CREATE POLICY "Users can view own private messages" ON public.wolf_private_messages
    FOR SELECT USING (
        auth.uid()::uuid = sender_id OR 
        auth.uid()::uuid = receiver_id
    );

-- Allow users to send private messages
CREATE POLICY "Users can send private messages" ON public.wolf_private_messages
    FOR INSERT WITH CHECK (auth.uid()::uuid = sender_id);

-- Allow users to update their own sent messages (for read status, etc.)
CREATE POLICY "Users can update own sent messages" ON public.wolf_private_messages
    FOR UPDATE USING (auth.uid()::uuid = sender_id OR auth.uid()::uuid = receiver_id);

-- Wolf chat policies for group chat
CREATE POLICY "Pack members can view chat" ON public.wolf_chat
    FOR SELECT USING (true); -- Allow all authenticated users to read chat

CREATE POLICY "Authenticated users can send chat messages" ON public.wolf_chat
    FOR INSERT WITH CHECK (auth.uid()::uuid = user_id);

-- Wolf reactions policies
CREATE POLICY "Users can view reactions" ON public.wolf_reactions
    FOR SELECT USING (true);

CREATE POLICY "Users can add reactions" ON public.wolf_reactions
    FOR INSERT WITH CHECK (auth.uid()::uuid = user_id);

CREATE POLICY "Users can manage own reactions" ON public.wolf_reactions
    FOR DELETE USING (auth.uid()::uuid = user_id);