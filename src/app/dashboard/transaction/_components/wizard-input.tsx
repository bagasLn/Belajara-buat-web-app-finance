"use client";

import { Button } from "@/components/ui/button";
import { Card, CardAction, CardContent } from "@/components/ui/card";
import { Field } from "@/components/ui/field";
import { Toggle } from "@/components/ui/toggle";
import { handleWizardInput } from "@/features/ai/chat";
import { cn } from "@/lib/utils";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { error } from "console";
import { BrainIcon, Loader2Icon, SendIcon, SparklesIcon } from "lucide-react";
import { Dispatch, KeyboardEvent, SetStateAction } from "react";
import { Controller, useForm } from "react-hook-form";
import z from "zod";

const formSchema = z.object({
  message: z.string().min(1, " Message i required"),
});

export default function WizardInput() {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      message: "",
    },
  });

  const { mutate, isPending } = useMutation({
    mutationFn: handleWizardInput,
    onSuccess: (Response) => {
      console.log(Response);
      form.reset();
    },
    onError: (error) => {
      console.log(error);
    },
  });

  function onSubmit(data: z.infer<typeof formSchema>) {
    mutate(data.message);
  }

  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      onSubmit(form.getValues());
    }
  }

  return (
    <Card className="w-full border-primary/20 p-0">
      <CardContent className="pr-2">
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className=" flex items-center gap-2"
        >
          <div className="text-primary">
            <SparklesIcon className="size-5" />
          </div>
          <Controller
            control={form.control}
            name="message"
            render={({ field }) => (
              <Field>
                <input
                  {...field}
                  id="form-message"
                  placeholder="Write your transaction here"
                  autoComplete="off"
                  className="h-4  focus:outline-none"
                  onKeyDown={handleKeyDown}
                  disabled={isPending}
                />
              </Field>
            )}
          />
          <Button
            type="submit"
            size="icon"
            variant="ghost"
            disabled={isPending}
          >
            {isPending ? (
              <Loader2Icon className="size-5 animat-spin" />
            ) : (
              <SendIcon className="size-5" />
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
