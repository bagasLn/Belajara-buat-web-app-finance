import { AppSidebar } from "@/components/layout/app-sidebar";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { ReactNode } from "react";
import ChatbotDrawer from "./_components/chatbot-drawer";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarTrigger />
      <main className="flex-1 p-4">
        {children}
        <ChatbotDrawer />
      </main>
    </SidebarProvider>
  );
}
