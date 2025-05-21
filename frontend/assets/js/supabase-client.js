import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm'

const supabaseUrl = 'https://dovyylhnscqknygyhfni.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRvdnl5bGhuc2Nxa255Z3loZm5pIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDcwNjk5ODksImV4cCI6MjA2MjY0NTk4OX0.FQA1FM05S4Q4qIZyrl14NKedC5RtED5ZHMIYXDYcUWQ';

// Create a single shared instance
export const supabase = createClient(supabaseUrl, supabaseAnonKey); 