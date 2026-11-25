"use client";

import {
  BanknoteIcon,
  CoinsIcon,
  LayoutDashboard,
  LogOutIcon,
} from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
} from "../ui/sidebar";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";

const sidebarItems = [
  {
    label: "Dashboard",
    icon: <LayoutDashboard />,
    href: "/dashboard",
  },
  {
    label: "Transaction",
    icon: <BanknoteIcon />,
    href: "/dashboard/transaction",
  },
];

export function AppSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();

  const { data: user } = useQuery({
    queryKey: ["user"],
    queryFn: async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      return user;
    },
  });

  const handleSignout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        toast.error("Failed to logout:" + error.message);
      } else {
        toast.success("Logout succesfully!");
        router.push("auth/login");
        router.refresh();
      }
    } catch {
      toast.error("An expected error occurred while logout");
    }
  };

  return (
    <Sidebar collapsible="icon" variant="floating">
      <SidebarHeader className="gap-2 flex-row items-center">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild>
              <Link href="/dashboard">
                <CoinsIcon className="text-primary size-5!" />
                <h1 className="text-2xl font-bold text-primary">Financial</h1>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarMenu>
            {sidebarItems.map((item) => (
              <SidebarMenuItem key={item.label}>
                <SidebarMenuButton
                  asChild
                  tooltip={item.label}
                  className={cn(
                    "py-6 px-5 text-md",
                    pathname === item.href
                      ? "bg-primary text-primary-foreground font-semibold hover:bg-primary hover:text-primary-foreground"
                      : "",
                  )}
                >
                  <Link href={item.href}>
                    {item.icon}
                    <span>{item.label}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className=" border-t border-sidebar-border">
        <div className="flex flex-col gap-2">
          {user && (
            <div className="px-3 pt-2">
              {user.user_metadata?.full_name && (
                <div className="font-semibold text-primary truncate">
                  {" "}
                  {user.user_metadata.full_name}
                </div>
              )}
              {user.user_metadata?.email && (
                <div className="text-xs text-muted-foreground truncate">
                  {" "}
                  {user.user_metadata.email}
                </div>
              )}
            </div>
          )}
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                className="w-full text-destructive hover:bg-destructive/10 hover:text-destructive py-5 cursor-pointer"
                onClick={handleSignout}
                tooltip="Logout"
              >
                <LogOutIcon className="size-4" />
                Sign Out
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
