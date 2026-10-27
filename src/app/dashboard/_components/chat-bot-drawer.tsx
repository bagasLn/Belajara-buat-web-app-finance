"use client";
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { handleChat } from "@/features/ai/chat";
import { cn } from "@/lib/utils";
import {
  BotIcon,
  EllipsisIcon,
  Loader,
  Loader2,
  RefreshCw,
  XIcon,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import ChatbotTextarea from "./chatbot-textarea";
import { useMutation } from "@tanstack/react-query";
import Markdown from "react-markdown";

export default function ChatbotDrawer() {
  const chatRef = useRef<HTMLDivElement>(null);

  const [conversation, setConversation] = useState<
    {
      role: string;
      parts: {
        text: string;
      }[];
    }[]
  >([]);

  const { mutate: handleChatMutation, isPending } = useMutation({
    mutationFn: handleChat,
    onSuccess: (response) => {
      const botMessage = {
        role: "model",
        parts: [{ text: response || "There is an error" }],
      };
      setConversation((prev) => [...prev, botMessage]);
    },
    onError: (error) => {
      const botMessage = {
        role: "model",
        parts: [{ text: "There is an error" + error.message }],
      };
      setConversation((prev) => [...prev, botMessage]);
    },
  });

  function sendMessage(message: string) {
    const newMessage = {
      role: "user",
      parts: [{ text: message }],
    };
    setConversation((prev) => [...prev, newMessage]);
    handleChatMutation(message);
  }

  useEffect(() => {
    if (chatRef.current) {
      chatRef.current?.scrollTo({
        top: chatRef.current.scrollHeight,
        behavior: "smooth",
      });
    }
  }, [conversation]);

  return (
    <Drawer direction="right" modal={false}>
      <DrawerTrigger className="fixed buttom-4 right-4" asChild>
        <Button
          className="size-14 rounded-full"
          size="icon-lg"
          variant="outline"
          //   onClick={async () => {
          //     const result = await handleChat();
          //     console.log(result);
          //   }}
        >
          <BotIcon className="size-6" />
        </Button>
      </DrawerTrigger>
      <DrawerContent className="w-screen! md:w-110!">
        <DrawerHeader className="flex flex-row justify-between">
          <div>
            <DrawerTitle className="text-primary font-bold">
              Ai Financial Advisor
            </DrawerTitle>
            <DrawerDescription>Get personelize financial</DrawerDescription>
          </div>
          <DrawerClose asChild>
            <Button variant="outline" size="icon">
              <XIcon />
            </Button>
          </DrawerClose>
        </DrawerHeader>
        <div className="no0-scrollbar overflow-y-auto px-4 h-full">
          {conversation.length > 0 ? (
            <div
              ref={chatRef}
              className="flex flex-col h-full overflow-x-hidden no-scrollbar overflow-y-auto gap-8"
            >
              {conversation.map((message, index) => (
                <div
                  key={`conversation-${index}`}
                  className={cn(
                    "flex flex-col gap-2",
                    message.role === "model" ? "items-start" : "items-end",
                  )}
                >
                  <div
                    className={cn("flex flex-col w-full", {
                      "bg-primary/20 text-primary px-5 py-2 rounded-3xl rounded-br-md w-fit max-w-3/4":
                        message.role === "user",
                    })}
                  >
                    {message.role === "model" && (
                      <div className="flex items-center text-xs gap-1 text-primary font-semibold">
                        <BotIcon />
                        Ai Advisor
                      </div>
                    )}
                    {message.role === "model" ? (
                      <div className="response-ai">
                        <Markdown>{message.parts[0].text}</Markdown>
                      </div>
                    ) : (
                      message.parts[0].text
                    )}
                  </div>
                </div>
              ))}
              {isPending && (
                <div className="flex items-center animate-pulse">
                  <Loader2 className="size-8 animate-spin text-primary/50" />
                </div>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full">
              <h2 className="text-3xl font-blod text-primary">Hai </h2>
              <h4 className="text-xl">Can i help you?</h4>
            </div>
          )}
        </div>
        <DrawerFooter>
          <ChatbotTextarea sendMessage={sendMessage} />
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
