"use server";

import { User } from "@/app/types/auth";
import { createClient } from "@/lib/supabase/server";
import { headers } from "next/headers";

export async function authRegister(user: User) {
  const supabase = await createClient();
  const headerList = await headers();
  const origin = headerList.get("origin");
  const { data, error } = await supabase.auth.signUp({
    email: user.email,
    password: user.password,
    options: {
      emailRedirectTo: origin ? `${origin}/auth/callback` : undefined,
      data: {
        full_name: user.full_name,
        phone: user.phone,
      },
    },
  });

  if (error) {
    throw new Error(error.message);
  }

  return data;
}
