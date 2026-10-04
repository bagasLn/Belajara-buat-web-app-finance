import { ENVIRONMENT } from "@/config/environment";
import { createBrowserClient } from "@supabase/ssr";

export const createClient = () =>
  createBrowserClient(ENVIRONMENT.supabaseUrl!, ENVIRONMENT.supabaseKey!); // tanda seru ini di gunakan supaya supabase nya ngga undefind
