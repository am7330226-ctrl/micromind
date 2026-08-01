import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

const SUPABASE_URL = 'https://foveaitqlhaurvtsikqv.supabase.co';
const SUPABASE_ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZvdmVhaXRxbGhhdXJ2dHNpa3F2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQzMDg1MzEsImV4cCI6MjA5OTg4NDUzMX0.qSQBgfjaKXNzPfXi4Cb-NY5O7sTUSPc8CB72V0oL5bI';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
