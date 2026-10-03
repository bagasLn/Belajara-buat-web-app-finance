--- setup pgvector extension
    CREATE EXTENSION IF NOT EXISTS vector;


---create tabel transcactions
CREATE TABLE IF NOT EXISTS public.transactions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
    category TEXT NOT NULL,
    amount NUMERIC NOT NULL,
    description TEXT,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    emdedding VECTOR(768),
    create_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);


-- Aktivase Role Level Securty (RLS)
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

-- Polic access untuk semua diperbolehkan
CREATE POLICY "Permissive rules for all" ON public.transactions
    FOR ALL USING (true);

-- Jika sudah ada system auth
-- CRATE POLICY "Users can manage their own transactions" ON public.transactions
--     FOR ALL USING (auth.uid () = user_id) 