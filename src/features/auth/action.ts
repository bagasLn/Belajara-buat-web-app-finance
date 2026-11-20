import { User } from "@/app/types/auth";
import { createClient } from "@/lib/supabase/server";
import { Phone } from "lucide-react";

export async function authRegister(user: User) {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email: user.email,
    password: user.password,
    options: {
      emailRedirectTo: `${window.location.origin}/auth/callback`,
      data: {
        full_name: user.full_name,
        Phone: user.phone,
      },
    },
  });

  if (error) {
    throw new Error(error.message);
  }

  return data;
}
