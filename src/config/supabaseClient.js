import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL || 'https://dovyylhnscqknygyhfni.supabase.co';
const supabaseKey = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRvdnl5bGhuc2Nxa255Z3loZm5pIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDcwNjk5ODksImV4cCI6MjA2MjY0NTk4OX0.FQA1FM05S4Q4qIZyrl14NKedC5RtED5ZHMIYXDYcUWQ';

const supabase = createClient(supabaseUrl, supabaseKey);

export { supabase };
export const auth = supabase.auth; 