import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://cykqlsbjqlhiqemkbuhy.supabase.co';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_u01tEZxEmXqMXJ8v2Yff3Q_LNXc0v9t';

export const supabase = createClient(supabaseUrl, supabaseKey);
export const getSupabaseClient = () => supabase;

