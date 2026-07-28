import { createClient } from "@/lib/supabase/server";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Users, UserPlus, Shield, Eye, Pencil, Trash2 } from "lucide-react";
import { formatDate, cn } from "@/lib/utils";

const permissionConfig: Record<string, { label: string; icon: typeof Eye; color: string }> = {
  viewer: { label: "Viewer", icon: Eye, color: "text-sky-500" },
  editor: { label: "Editor", icon: Pencil, color: "text-amber-500" },
  admin: { label: "Admin", icon: Shield, color: "text-emerald-500" },
};

const defaultPerm = permissionConfig.viewer;

export default async function CollaboratorsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: collaborators } = await supabase
    .from("collaborators")
    .select("*")
    .eq("owner_id", user!.id)
    .order("invited_at", { ascending: false });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Collaborators</h1>
        <p className="text-muted-foreground">
          Manage who has access to your simulations and digital twins.
        </p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <UserPlus className="h-4 w-4 text-muted-foreground" />
            <CardTitle className="text-base">Invite Collaborator</CardTitle>
          </div>
          <CardDescription>
            Send an invitation to collaborate on your workspace.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form className="flex flex-col gap-4 sm:flex-row sm:items-end">
            <div className="flex-1 space-y-2">
              <label htmlFor="email" className="text-sm font-medium">
                Email Address
              </label>
              <input
                id="email"
                type="email"
                placeholder="colleague@company.com"
                required
                className="flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </div>
            <div className="w-full sm:w-48 space-y-2">
              <label htmlFor="permission" className="text-sm font-medium">
                Permission Level
              </label>
              <select
                id="permission"
                className="flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                defaultValue="viewer"
              >
                <option value="viewer">Viewer</option>
                <option value="editor">Editor</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            <button
              type="submit"
              className={cn(buttonVariants({ className: "shrink-0" }))}
            >
              <UserPlus className="mr-2 h-4 w-4" />
              Invite
            </button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-muted-foreground" />
            <CardTitle className="text-base">Current Collaborators</CardTitle>
          </div>
          <CardDescription>
            {collaborators?.length ?? 0} collaborator{collaborators?.length !== 1 ? "s" : ""} in your workspace
          </CardDescription>
        </CardHeader>
        <CardContent>
          {collaborators && collaborators.length > 0 ? (
            <div className="space-y-3">
              {collaborators.map((collab) => {
                const perm = (collab.permission && permissionConfig[collab.permission]) || defaultPerm;
                const PermIcon = perm.icon;
                return (
                  <div
                    key={collab.id}
                    className="flex items-center justify-between rounded-lg border p-4"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-muted text-sm font-medium">
                        {collab.collaborator_id.slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-sm font-medium">{collab.collaborator_id}</p>
                        <p className="text-xs text-muted-foreground">
                          {collab.accepted_at
                            ? `Joined ${formatDate(collab.accepted_at)}`
                            : `Invited ${formatDate(collab.invited_at)}`}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="gap-1">
                        <PermIcon className={`h-3 w-3 ${perm.color}`} />
                        {perm.label}
                      </Badge>
                      <button className="inline-flex items-center justify-center rounded-lg p-2 text-destructive hover:bg-destructive/10 transition-colors">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Users className="h-10 w-10 text-muted-foreground/40" />
              <p className="mt-3 text-sm text-muted-foreground">
                No collaborators yet. Invite someone to get started.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
