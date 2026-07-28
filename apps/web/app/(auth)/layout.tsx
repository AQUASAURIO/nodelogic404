import Link from "next/link";
import { Zap } from "lucide-react";
import { APP_NAME } from "@repo/shared/constants";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-muted/30 p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 group">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white shadow-lg group-hover:shadow-xl transition-shadow">
              <Zap className="h-5 w-5" />
            </div>
            <span className="text-2xl font-bold bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 bg-clip-text text-transparent">
              {APP_NAME}
            </span>
          </Link>
        </div>
        {children}
      </div>
    </div>
  );
}
