"use server";

import { User, UserUpdated } from "@/app/types/auth";
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

export async function authLogin(user: User) {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email: user.email,
    password: user.password,
  });

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

export async function updateUser(
  type: "info" | "password",
  payload: UserUpdated,
) {
  const supabase = await createClient();
  const newData =
    type === "info"
      ? {
          data: { ...payload },
        }
      : {
          password: payload.password,
        };
  const { data, error } = await supabase.auth.updateUser(newData);

  if (error) {
    throw new Error(error.message);
  }

  return data;
}
export async function getUserData() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Inauthorized");

  return user;
}
