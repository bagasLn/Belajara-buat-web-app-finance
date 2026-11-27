CREATE TABLE IF NOT EXISTS public.chat_sessions (
id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
title TEXT NOT NULL DEFAULT 'New Conversation',
messages JSONB NOT NULL DEFAULT '[]':: jsonb,
user_id UUID REFERENCES aut.users(id) ON DELETE CASCADE,
created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.chat_sessions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage their own chat sessions" ON public.chat_sessions;

CREATE POLICY "Users can manage their own chat sessions" ON public.chat_sessions
 FOR ALL USING (auth.uid () = user_id) 