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
import { handleChatStreaming } from "@/features/ai/chat";
import { cn } from "@/lib/utils";
import {
  ArrowLeftIcon,
  BotIcon,
  ChevronDownIcon,
  Loader2,
  MessageSquareIcon,
  PlusIcon,
  Trash2Icon,
  XIcon,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import ChatbotTextarea from "./chatbot-textarea";
import { useMutation } from "@tanstack/react-query";
import Markdown from "react-markdown";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Conversation } from "@/app/types/ai";

export default function ChatbotDrawer() {
  const chatRef = useRef<HTMLDivElement>(null);
  const [conversation, setConversation] = useState<Conversation[]>([]);
  const [isThinking, setIsThinking] = useState<boolean>(false);
  const [mode, setMode] = useState<"general" | "personal">("general");

  const [showHistory, setShowHistory] = useState<boolean>(false);

  // const { mutate: handleChatMutation, isPending } = useMutation({
  //   mutationFn: ({
  //     isThinking,
  //   }: {
  //     isThinking: boolean;
  //   }) => handleChat(conversation, isThinking),
  //   onSuccess: (response) => {
  //     let parts: {
  //       text: string;
  //       thought?: boolean;
  //     }[] = [];

  //     if (response?.thought !== "") {
  //       parts = [
  //         ...parts,
  //         { thought: true, text: response?.thought || "There is an error" },
  //       ];
  //     }

  //     const botMessage = {
  //       role: "model",
  //       parts: [...parts, { text: response?.answer || "There is an error" }],
  //     };
  //     setConversation((prev) => [...prev, botMessage]);
  //   },
  //   onError: (error) => {
  //     const botMessage = {
  //       role: "model",
  //       parts: [{ text: "There is an error" + error.message }],
  //     };
  //     setConversation((prev) => [...prev, botMessage]);
  //   },
  // });

  // const {
  //   mutate: handleChatWithThinkingMutation,
  //   isPending: isPendingChatWithThinking,
  // } = useMutation({
  //   mutationFn: handleChatWithThinking,
  //   onSuccess: (response) => {
  //     const botMessage = {
  //       role: "model",
  //       parts: [
  //         { thought: true, text: response?.thought || "There is an error" },
  //         { text: response?.answer || "There is an error" },
  //       ],
  //     };
  //     setConversation((prev) => [...prev, botMessage]);
  //   },
  //   onError: (error) => {
  //     const botMessage = {
  //       role: "model",
  //       parts: [{ text: "There is an error" + error.message }],
  //     };
  //     setConversation((prev) => [...prev, botMessage]);
  //   },
  // });

  const { mutate: handleChatMutation, isPending } = useMutation({
    mutationFn: async ({ isThinking }: { isThinking: boolean }) => {
      if (isThinking) {
        setConversation((prev) => [
          ...prev,
          { role: "model", parts: [{ thought: true, text: "" }, { text: "" }] },
        ]);
        const response = await handleChatStreaming(
          conversation,
          isThinking,
          mode,
        );
        for await (const chunk of response) {
          setConversation((prev) => {
            const newConversation = [...prev];
            const lastIndex = newConversation.length - 1;

            const parts = newConversation[lastIndex].parts;

            newConversation[lastIndex] = {
              ...newConversation[lastIndex],
              parts: [
                {
                  ...parts[0],
                  text: chunk.startsWith("[thought")
                    ? parts[0].text + chunk.replace("[thought]", "")
                    : parts[0].text,
                },
                {
                  text: !chunk.startsWith("[thought")
                    ? parts[1].text + chunk
                    : parts[1].text,
                },
              ],
            };
            return newConversation;
          });
        }
        return response;
      } else {
        setConversation((prev) => [
          ...prev,
          { role: "model", parts: [{ text: "" }] },
        ]);
        const response = await handleChatStreaming(
          conversation,
          isThinking,
          mode,
        );
        for await (const chunk of response) {
          setConversation((prev) => {
            const newConversation = [...prev];
            const lastIndex = newConversation.length - 1;

            newConversation[lastIndex] = {
              ...newConversation[lastIndex],
              parts: [
                { text: newConversation[lastIndex].parts[0].text + chunk },
              ],
            };
            return newConversation;
          });
        }
        return response;
      }
    },
    // onSuccess: (response) => {
    //   let parts: {
    //     text: string;
    //     thought?: boolean;
    //   }[] = [];

    //   if (response?.thought !== "") {
    //     parts = [
    //       ...parts,
    //       { thought: true, text: response?.thought || "There is an error" },
    //     ];
    //   }

    //   const botMessage = {
    //     role: "model",
    //     parts: [...parts, { text: response?.answer || "There is an error" }],
    //   };
    //   setConversation((prev) => [...prev, botMessage]);
    // },
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
    handleChatMutation({ isThinking });
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
          className="rounded-full size-14"
          size="icon-lg"

          //   onClick={async () => {
          //     const result = await handleChat();
          //     console.log(result);
          //   }}
        >
          <BotIcon className="size-6" />
        </Button>
      </DrawerTrigger>
      <DrawerContent className="w-screen! md:w-110! flex flex-col h-full">
        <DrawerHeader className="flex flex-row items-center justify-between pb-4 border-b shrink-0">
          {showHistory ? (
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                className="cursor-pointer"
                onClick={() => setShowHistory(false)}
              >
                <ArrowLeftIcon />
              </Button>
              <DrawerTitle className="text-base font-bold text-primary">
                Chat History
              </DrawerTitle>
            </div>
          ) : (
            <div>
              <DrawerTitle className="font-bold text-primary">
                Ai Financial Advisor
              </DrawerTitle>
              <DrawerDescription className="text-xs">
                Get personelize financial
              </DrawerDescription>
            </div>
          )}

          <div className="flex items-center gap-1.5 ml-auto">
            {showHistory ? (
              <Button>
                <PlusIcon className="size-4" />
                New Chat
              </Button>
            ) : (
              <>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setShowHistory(true)}
                  className="cursor-pointer"
                >
                  <MessageSquareIcon className="size-4" />
                </Button>

                <Button
                  variant="outline"
                  size="icon"
                  className="cursor-pointer"
                >
                  <PlusIcon className="size-4" />
                </Button>
              </>
            )}
          </div>

          <DrawerClose asChild>
            <Button variant="outline" size="icon">
              <XIcon />
            </Button>
          </DrawerClose>
        </DrawerHeader>
        <div className="flex flex-col flex-1 min-h-0 px-4 py-2 overflow-y-auto no-scrollbar">
          {showHistory ? (
            <div>
              <div className="flex flex-col items-center justify-center gap-2 py-12 text-center">
                <MessageSquareIcon className="size-10 text-muted-foreground/40" />
                <h4 className="text-sm font-medium text-muted-foreground">
                  No chat history yet
                </h4>
                <p className="text-xs text-muted-foreground/70">
                  Star a new conversation to get financial advice
                </p>
              </div>
              {/* <div className="flex flex-col gap-2 overflow-y-auto">
                <div className="flex items-center justify-between p-3 text-left transition-all cursor-pointer rounded-xl border-border hover:bg-muted/70 group">
                  <span className="font-medium truncate">Title</span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="cursor-pointer hover:text-destructive text-muted-foreground"
                  >
                    <Trash2Icon />
                  </Button>
                </div>
              </div> */}
            </div>
          ) : conversation.length > 0 ? (
            <div
              ref={chatRef}
              className="flex flex-col h-full gap-8 overflow-x-hidden overflow-y-auto no-scrollbar"
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
                      <div className="flex items-center gap-1 text-xs font-semibold text-primary">
                        <BotIcon />
                        Ai Advisor
                      </div>
                    )}
                    {message.role === "model" ? (
                      <div className="response-ai">
                        {message.parts.map((part, indexPart) => (
                          <div key={`respons-ai-${index}-${indexPart}`}>
                            {part.thought ? (
                              <Collapsible>
                                <CollapsibleTrigger asChild>
                                  <Button variant="ghost">
                                    Look This Thinking
                                    <ChevronDownIcon />
                                  </Button>
                                </CollapsibleTrigger>
                                <CollapsibleContent>
                                  <div className="pl-2 ml-4 border-l">
                                    <Markdown>{part.text}</Markdown>
                                  </div>
                                </CollapsibleContent>
                              </Collapsible>
                            ) : (
                              <Markdown>{part.text}</Markdown>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      message.parts[0].text
                    )}
                  </div>
                </div>
              ))}
              {isPending && (
                <div className="flex items-center -mt-8 animate-pulse">
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
        {!showHistory && (
          <DrawerFooter>
            <ChatbotTextarea
              isThinking={isThinking}
              setIsThinking={setIsThinking}
              sendMessage={sendMessage}
              mode={mode}
              setMode={setMode}
            />
          </DrawerFooter>
        )}
      </DrawerContent>
    </Drawer>
  );
}
