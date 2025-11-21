import {
  Home,
  Settings,
  Upload,
  History,
  User,
  Mic,
  FileText,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar";
import Link from "next/link";
import { authClient } from "@/lib/auth-client";
import SignOutButton from "@/components/auth/sign-out-button";
import { Skeleton } from "@/components/ui/skeleton";

// Menu items.
const items = [
  {
    title: "Overview",
    url: "/home",
    icon: Home,
  },
  {
    title: "Upload Document",
    url: "/upload",
    icon: Upload,
  },
  {
    title: "Practice Session",
    url: "/practice",
    icon: Mic,
  },
  {
    title: "Past Sessions",
    url: "/review",
    icon: History,
  },
  {
    title: "Answers",
    url: "/answers",
    icon: FileText,
  },
  {
    title: "Settings",
    url: "/settings",
    icon: Settings,
  },
];

export function AppSidebar() {
  const { data: session } = authClient.useSession();

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="border-b border-border p-4 group-data-[collapsible=icon]:p-2">
        {!session ? (
          <div className="flex items-center gap-3 px-2 group-data-[collapsible=icon]:px-0 group-data-[collapsible=icon]:justify-center">
            <Skeleton className="h-8 w-8 rounded-full" />
            <div className="flex flex-col gap-1 group-data-[collapsible=icon]:hidden">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-3 w-32" />
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-3 px-2 group-data-[collapsible=icon]:px-0 group-data-[collapsible=icon]:justify-center">
            <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center shrink-0">
              <User className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="flex flex-col overflow-hidden group-data-[collapsible=icon]:hidden">
              <span className="text-sm font-medium truncate">
                {session.user?.name || "User"}
              </span>
              <span className="text-xs text-muted-foreground truncate font-mono">
                {session.user?.email || "user@behave.ai"}
              </span>
            </div>
          </div>
        )}
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Application</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild tooltip={item.title}>
                    <Link href={item.url}>
                      <item.icon />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="p-4 border-t border-border group-data-[collapsible=icon]:p-2">
        <div className="group-data-[collapsible=icon]:hidden">
          <SignOutButton />
        </div>
        {/* In icon mode, we might want a simplified logout or just hide it. 
            Hiding it for now as SignOutButton typically has text. 
            Ideally SignOutButton would be responsive or we show an icon-only version here. */}
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
