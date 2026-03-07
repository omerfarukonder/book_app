import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://akdtekgrwznfqkyusuxs.supabase.co';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFrZHRla2dyd3puZnFreXVzdXhzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAzMDc0MjIsImV4cCI6MjA4NTg4MzQyMn0.BuherUYMD6tS0nNyWITfpW7nrRMaBijwBuNrJU27zXI';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
