import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://rvdpjrxaxvdbouwichru.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ2ZHBqcnhheHZkYm91d2ljaHJ1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQxODk4NzAsImV4cCI6MjA4OTc2NTg3MH0.cJZCUQkPjeuDyILv7M14adE1WGLsE8TB-WJ4NFk7pVU';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
