import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Toggle } from "@/components/ui/toggle";
import { cn } from "@/lib/utils";
import { zodResolver } from "@hookform/resolvers/zod";
import { BrainIcon, SendIcon } from "lucide-react";
import { Dispatch, KeyboardEvent, SetStateAction } from "react";
import { Controller, useForm } from "react-hook-form";
import z from "zod";

const formSchema = z.object({
  message: z.string().min(1, " Message i required"),
});

export default function ChatbotTextarea({
  sendMessage,
  isThinking,
  setIsThinking,
}: {
  sendMessage: (message: string) => void;
  isThinking: boolean;
  setIsThinking: Dispatch<SetStateAction<boolean>>;
}) {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      message: "",
    },
  });

  function onSubmit(data: z.infer<typeof formSchema>) {
    sendMessage(data.message);
    form.reset();
  }

  function handleKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      onSubmit(form.getValues());
    }
  }

  return (
    <form
      onSubmit={form.handleSubmit(onSubmit)}
      className=" flex flex-col p-2 bg-secondary rounded-b-2xl"
    >
      <Controller
        control={form.control}
        name="message"
        render={({ field }) => (
          <Field>
            <textarea
              {...field}
              id="form-message"
              placeholder="ask Ai Advisor"
              autoComplete="off"
              className="h-16 resize-none rounded-md px-3 py-2 focus:outline-none"
              onKeyDown={handleKeyDown}
            />
          </Field>
        )}
      />
      <div className="flex justify-between items-center">
        <div>
          <Toggle
            size="sm"
            variant="outline"
            pressed={isThinking}
            onPressedChange={setIsThinking}
            className={cn("text-xs px-0 py-0 h-8 w-8", {
              "bg-primary/25!": isThinking,
            })}
          >
            <BrainIcon className="size-4" />
          </Toggle>
        </div>
        <div>
          <Button
            type="submit"
            size="icon"
            variant="ghost"
            className="text-primary hover:bg-primary/10 hover:text-primary cursor-pointer disabled:bg-transparent"
          >
            <SendIcon className="size-5" />
          </Button>
        </div>
      </div>
    </form>
  );
}
