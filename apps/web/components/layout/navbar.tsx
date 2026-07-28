"use client";

import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { APP_NAME } from "@repo/shared/constants";
import { Menu, X, Zap } from "lucide-react";

export function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur-lg">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600">
            <Zap className="h-4 w-4 text-white" />
          </div>
          <span className="text-xl font-bold">{APP_NAME}</span>
        </Link>

        <nav className="hidden md:flex items-center gap-6">
          <Link href="/#features" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
            Features
          </Link>
          <Link href="/#how-it-works" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
            How It Works
          </Link>
          <Link href="/#pricing" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
            Pricing
          </Link>
        </nav>

        <div className="hidden md:flex items-center gap-3">
          <Button variant="ghost" asChild>
            <Link href="/login">Sign in</Link>
          </Button>
          <Button asChild>
            <Link href="/register">Get Started Free</Link>
          </Button>
        </div>

        <button
          className="md:hidden p-2"
          onClick={() => setMobileOpen(!mobileOpen)}
        >
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {mobileOpen && (
        <div className="md:hidden border-t bg-background p-4 space-y-3">
          <Link href="/#features" className="block text-sm font-medium py-2" onClick={() => setMobileOpen(false)}>Features</Link>
          <Link href="/#how-it-works" className="block text-sm font-medium py-2" onClick={() => setMobileOpen(false)}>How It Works</Link>
          <Link href="/#pricing" className="block text-sm font-medium py-2" onClick={() => setMobileOpen(false)}>Pricing</Link>
          <div className="pt-3 border-t space-y-2">
            <Button variant="outline" className="w-full" asChild>
              <Link href="/login">Sign in</Link>
            </Button>
            <Button className="w-full" asChild>
              <Link href="/register">Get Started Free</Link>
            </Button>
          </div>
        </div>
      )}
    </header>
  );
}
