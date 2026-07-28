"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Avatar } from "@/components/ui/avatar";
import { LogOut, Bell } from "lucide-react";
import { useState } from "react";

interface DashboardHeaderProps {
  user: {
    email?: string;
    user_metadata?: Record<string, string>;
  };
}

export function DashboardHeader({ user }: DashboardHeaderProps) {
  const router = useRouter();
  const supabase = createClient();
  const [showMenu, setShowMenu] = useState(false);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  };

  const initials = user.user_metadata?.full_name
    ?.split(" ")
    .map((n: string) => n[0])
    .join("")
    .toUpperCase() || user.email?.[0]?.toUpperCase() || "?";

  return (
    <header className="flex h-16 items-center justify-between border-b bg-card px-6">
      <div />
      <div className="flex items-center gap-4">
        <button className="relative rounded-lg p-2 hover:bg-muted transition-colors">
          <Bell className="h-5 w-5 text-muted-foreground" />
          <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-primary" />
        </button>
        <div className="relative">
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="flex items-center gap-2 rounded-lg p-1 hover:bg-muted transition-colors"
          >
            <Avatar
              src={user.user_metadata?.avatar_url}
              fallback={initials}
              size="sm"
            />
            <span className="hidden text-sm font-medium md:block">
              {user.user_metadata?.full_name || user.email}
            </span>
          </button>
          {showMenu && (
            <div className="absolute right-0 top-full z-50 mt-2 w-56 rounded-xl border bg-card p-1 shadow-lg">
              <div className="px-3 py-2">
                <p className="text-sm font-medium">{user.user_metadata?.full_name || "User"}</p>
                <p className="text-xs text-muted-foreground">{user.email}</p>
              </div>
              <div className="border-t my-1" />
              <Link
                href="/settings"
                className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm hover:bg-muted transition-colors"
                onClick={() => setShowMenu(false)}
              >
                Settings
              </Link>
              <button
                onClick={handleSignOut}
                className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-destructive hover:bg-destructive/10 transition-colors"
              >
                <LogOut className="h-4 w-4" />
                Sign out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
