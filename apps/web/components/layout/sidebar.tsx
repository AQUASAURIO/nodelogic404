"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { APP_NAME } from "@repo/shared/constants";
import {
  LayoutDashboard,
  Play,
  GitBranch,
  Users,
  BarChart3,
  Settings,
  Zap,
  ChevronLeft,
} from "lucide-react";

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Simulations", href: "/simulations", icon: Play },
  { name: "Digital Twins", href: "/digital-twins", icon: GitBranch },
  { name: "Collaborators", href: "/collaborators", icon: Users },
  { name: "Analytics", href: "/analytics", icon: BarChart3 },
  { name: "Settings", href: "/settings", icon: Settings },
];

interface SidebarProps {
  collapsed?: boolean;
  onToggle?: () => void;
}

export function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const pathname = usePathname();

  return (
    <aside
      className={cn(
        "flex h-full flex-col border-r bg-card transition-all duration-300",
        collapsed ? "w-16" : "w-64"
      )}
    >
      <div className="flex h-16 items-center justify-between border-b px-4">
        {!collapsed && (
          <Link href="/dashboard" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600">
              <Zap className="h-4 w-4 text-white" />
            </div>
            <span className="font-bold">{APP_NAME}</span>
          </Link>
        )}
        <button
          onClick={onToggle}
          className="rounded-lg p-1.5 hover:bg-muted transition-colors"
        >
          <ChevronLeft className={cn("h-4 w-4 transition-transform", collapsed && "rotate-180")} />
        </button>
      </div>

      <nav className="flex-1 space-y-1 p-2">
        {navigation.map((item) => {
          const isActive = pathname.startsWith(item.href);
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
              title={collapsed ? item.name : undefined}
            >
              <item.icon className="h-5 w-5 shrink-0" />
              {!collapsed && <span>{item.name}</span>}
            </Link>
          );
        })}
      </nav>

      {!collapsed && (
        <div className="m-2 rounded-lg bg-gradient-to-br from-indigo-500/10 to-purple-500/10 p-4">
          <p className="text-xs font-medium text-primary">Upgrade to Pro</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Unlimited simulations & twins
          </p>
        </div>
      )}
    </aside>
  );
}
