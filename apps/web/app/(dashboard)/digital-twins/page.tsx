import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Plus, GitBranch, Clock } from "lucide-react";
import { formatRelativeTime, cn } from "@/lib/utils";
import { TWIN_TYPES } from "@repo/shared/constants";

const twinTypeLabel = Object.fromEntries(
  TWIN_TYPES.map((t) => [t.value, t.label])
);

export default async function DigitalTwinsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: twins } = await supabase
    .from("digital_twins")
    .select("*")
    .eq("user_id", user!.id)
    .order("updated_at", { ascending: false });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Digital Twins</h1>
          <p className="text-muted-foreground">
            Manage your collaboration and workflow models.
          </p>
        </div>
        <Link href="/digital-twins/new" className={cn(buttonVariants())}>
          <Plus className="mr-2 h-4 w-4" />
          Create New Twin
        </Link>
      </div>

      {twins && twins.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {twins.map((twin) => (
            <Link key={twin.id} href={`/digital-twins/${twin.id}`}>
              <Card className="transition-shadow hover:shadow-md h-full">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <CardTitle className="text-lg">{twin.name}</CardTitle>
                      <CardDescription>
                        {twinTypeLabel[twin.type] ?? twin.type}
                      </CardDescription>
                    </div>
                    <Badge variant={twin.is_active ? "success" : "secondary"}>
                      {twin.is_active ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  {twin.description && (
                    <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
                      {twin.description}
                    </p>
                  )}
                  <div className="flex items-center text-xs text-muted-foreground">
                    <Clock className="mr-1 h-3 w-3" />
                    Updated {formatRelativeTime(twin.updated_at)}
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <div className="rounded-full bg-muted p-4">
              <GitBranch className="h-8 w-8 text-muted-foreground/60" />
            </div>
            <h3 className="mt-4 text-lg font-semibold">No digital twins yet</h3>
            <p className="mt-1 text-sm text-muted-foreground text-center max-w-sm">
              Create your first digital twin to model your collaboration workflows and team dynamics.
            </p>
            <Link
              href="/digital-twins/new"
              className={cn(buttonVariants({ className: "mt-6" }))}
            >
              <Plus className="mr-2 h-4 w-4" />
              Create Your First Twin
            </Link>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
