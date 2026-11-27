"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { updateUser } from "@/features/auth/action";
import { createClient } from "@/lib/supabase/client";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Loader2, ShieldCheckIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import z, { email } from "zod";

const infoSchema = z.object({
  full_name: z.string().min(1, "Full name is required"),
  phone: z.string().min(1, "Phone is required"),
});

const passwordSchema = z
  .object({
    password: z.string().min(6, "Password must be at least 6 characters"),
    confirm_password: z.string().min(1, "Confirm Password is required"),
  })
  .refine((data) => data.password === data.confirm_password, {
    message: "Password do not match",
    path: ["confirmPassword"],
  });

export default function ProfilePage() {
  const router = useRouter();
  const supabase = createClient();

  const infoForm = useForm<z.infer<typeof infoSchema>>({
    resolver: zodResolver(infoSchema),
    defaultValues: {
      full_name: "",
      phone: "",
    },
  });

  const passwordForm = useForm<z.infer<typeof passwordSchema>>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      password: "",
      confirm_password: "",
    },
  });

  const { data: user } = useQuery({
    queryKey: ["user"],
    queryFn: async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      return user;
    },
  });

  useEffect(() => {
    infoForm.reset({
      full_name: user?.user_metadata?.full_name ?? "",
      phone: user?.user_metadata?.phone ?? "",
    });
  }, [user]);

  const updateInfoMutation = useMutation({
    mutationFn: (data: z.infer<typeof infoSchema>) => updateUser(data),
    onSuccess: (data) => {
      toast.success("User info updated succesfully!");
    },
    onError: (error) => {
      toast.error(
        error instanceof Error ? error.message : "Failed to update profile",
      );
    },
  });

  const { mutate, isPending, isSuccess } = useMutation({
    mutationFn: (payload: {
      type: "info" | "password";
      data: z.infer<typeof infoSchema> | z.infer<typeof passwordSchema>;
    }) => updateUser(payload.type, payload.data),
    onSuccess: () => {
      toast.success("User  updated successfully!");
    },
    onError: (error) => {
      toast.error(
        error instanceof Error ? error.message : "Failed to update user",
      );
    },
  });

  useEffect(() => {
    if (isSuccess) {
      passwordForm.reset({
        password: "",
        confirm_password: "",
      });
    }
  }, [isSuccess]);

  const onUpdateInfoSubmit = (data: z.infer<typeof infoSchema>) => {
    mutate({
      type: "info",
      data,
    });
  };

  const onUpdatePasswordSubmit = (data: z.infer<typeof passwordSchema>) => {
    mutate({
      type: "password",
      data,
    });
  };

  return (
    <div className="p-2 space-y-4">
      <section id="header">
        <h1 className="text-4xl font-bold text-primary gap">Profile</h1>
        <p>Manage you account profile details and securty option</p>
      </section>

      <div className="grid lg:grid-cols-2 gap-6">
        <Card className="gap-4">
          <CardHeader>
            <CardTitle className="text-2xl font-bold">
              Accoutn Information
            </CardTitle>
            <CardDescription>
              Update your full name and phone number.
            </CardDescription>
          </CardHeader>
          <form onSubmit={infoForm.handleSubmit(onUpdateInfoSubmit)}>
            <CardContent>
              <FieldGroup className="gap-3">
                <Field className="gap-1">
                  <FieldLabel htmlFor="email">Email</FieldLabel>
                  <Input
                    id="email"
                    type="email"
                    value={user?.email || ""}
                    placeholder="insert your email"
                    disabled={true}
                  />
                  <span className="text-xs text-muted-foreground mt-1">
                    Email addres cannot be change
                  </span>
                </Field>

                <Controller
                  control={infoForm.control}
                  name="full_name"
                  render={({ field, fieldState }) => (
                    <Field className="gap-1">
                      <FieldLabel htmlFor="full_name">Full Name</FieldLabel>
                      <Input
                        {...field}
                        id="full_name"
                        placeholder="insert your full name"
                        disabled={isPending}
                        required
                      />
                      {fieldState.invalid && (
                        <FieldError errors={[fieldState.error]} />
                      )}
                    </Field>
                  )}
                />

                <Controller
                  control={infoForm.control}
                  name="phone"
                  render={({ field, fieldState }) => (
                    <Field className="gap-1">
                      <FieldLabel htmlFor="phone">Phone</FieldLabel>
                      <Input
                        {...field}
                        id="phone"
                        type="tel"
                        placeholder="insert your phone number"
                        disabled={false}
                        required
                      />
                      {fieldState.invalid && (
                        <FieldError errors={[fieldState.error]} />
                      )}
                    </Field>
                  )}
                />
              </FieldGroup>
            </CardContent>
            <CardFooter className="flex-col space-y-4 pt-6">
              <Button
                type="submit"
                className="w-full text-md font-semibold py-5 cursor-pointer"
              >
                {isPending ? (
                  <div className="flex gap-2">
                    <Loader2 className="w-4 h-2 mr-2 animate-spin " />
                    Saving...
                  </div>
                ) : (
                  "Save Profile"
                )}
              </Button>
            </CardFooter>
          </form>
        </Card>

        <Card className="gap-4">
          <CardHeader>
            <CardTitle className="text-2xl font-bold">
              Securty Settings
            </CardTitle>
            <CardDescription>
              Update your password ti keep your account secure
            </CardDescription>
            <div className=" p-3 rounded-xl border border-border/40 bg-muted/30 text-xs space-y-3">
              <div className="font-semibold text-muted-foreground flex items-center gap-2">
                <ShieldCheckIcon className="size-3 text-primary" />
                Password securty rules:
              </div>
              <ul className="space-y-1.5 text-muted-foreground">
                <li>Minimunm 6 Characters (Required)</li>
                <li>Include a number or special characters (Recommended)</li>
              </ul>
            </div>
          </CardHeader>
          <form onSubmit={passwordForm.handleSubmit(onUpdatePasswordSubmit)}>
            <CardContent>
              <FieldGroup className="gap-3">
                <Controller
                  control={passwordForm.control}
                  name="password"
                  render={({ field, fieldState }) => (
                    <Field className="gap-1">
                      <FieldLabel htmlFor="password">Password</FieldLabel>
                      <Input
                        {...field}
                        id="password"
                        type="password"
                        placeholder="At least 6 characters"
                        disabled={false}
                        required
                      />
                      {fieldState.invalid && (
                        <FieldError errors={[fieldState.error]} />
                      )}
                    </Field>
                  )}
                />

                <Controller
                  control={passwordForm.control}
                  name="confirm_password"
                  render={({ field, fieldState }) => (
                    <Field className="gap-1">
                      <FieldLabel htmlFor="confirm_password">
                        Confrim Password
                      </FieldLabel>
                      <Input
                        {...field}
                        id="confirm_password"
                        type="password"
                        placeholder="Repeat your password"
                        disabled={false}
                        required
                      />
                      {fieldState.invalid && (
                        <FieldError errors={[fieldState.error]} />
                      )}
                    </Field>
                  )}
                />
              </FieldGroup>
            </CardContent>
            <CardFooter className="flex-col space-y-4 pt-6">
              <Button
                type="submit"
                className="w-full text-md font-semibold py-5 cursor-pointer"
              >
                {isPending ? (
                  <div className="flex gap-2">
                    <Loader2 className="w-4 h-2 mr-2 animate-spin " />
                    Updating...
                  </div>
                ) : (
                  "Change Password"
                )}
              </Button>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
}
