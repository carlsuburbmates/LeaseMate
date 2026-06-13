import { useEffect, useMemo, useState } from "react";
import { useLocation } from "wouter";
import PublicLayout from "@/components/PublicLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { trpc } from "@/lib/trpc";
import { getLoginUrl, isLocalAuth } from "@/const";
import { toast } from "sonner";

type LocalRole = "customer" | "provider" | "operator" | "admin";

const ROLE_DESTINATION: Record<LocalRole, string> = {
  customer: "/dashboard",
  provider: "/provider/dashboard",
  operator: "/ops",
  admin: "/ops",
};

export default function Login() {
  const [, navigate] = useLocation();
  const localAuth = isLocalAuth();
  const [email, setEmail] = useState("alex.chen@test.leasemate.com.au");
  const [name, setName] = useState("Alex Chen");
  const [role, setRole] = useState<LocalRole>("customer");

  const { data: localUsers, isLoading: usersLoading } = trpc.auth.localUsers.useQuery(undefined, {
    enabled: localAuth,
  });
  const utils = trpc.useUtils();

  const loginMutation = trpc.auth.localLogin.useMutation({
    onSuccess: async result => {
      await utils.auth.me.invalidate();
      toast.success(`Signed in as ${result.user.name ?? result.user.email ?? result.user.openId}`);
      const nextPath = ROLE_DESTINATION[(result.user.role as LocalRole) ?? role] ?? "/dashboard";
      navigate(nextPath);
    },
    onError: error => {
      toast.error(error.message);
    },
  });

  useEffect(() => {
    if (!localAuth) {
      window.location.href = getLoginUrl();
    }
  }, [localAuth]);

  const quickUsers = useMemo(() => (Array.isArray(localUsers) ? localUsers : []), [localUsers]);

  if (!localAuth) {
    return null;
  }

  return (
    <PublicLayout>
      <div className="container max-w-4xl py-16">
        <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
          <section className="rounded-3xl border border-stone-200 bg-white p-8 shadow-sm">
            <div className="mb-6">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-stone-500">
                LeaseMate Auth
              </p>
              <h1 className="mt-2 text-3xl font-semibold tracking-tight text-stone-900">
                Sign in
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-stone-600">
                Sign in by creating or reusing a database-backed user. The app issues the same
                session cookie used across customer, provider, and ops flows.
              </p>
            </div>

            <form
              className="space-y-4"
              onSubmit={async event => {
                event.preventDefault();
                await loginMutation.mutateAsync({
                  email: email.trim() || undefined,
                  name: name.trim() || undefined,
                  role,
                });
              }}
            >
              <label className="block text-sm font-medium text-stone-700">
                Email
                <Input
                  className="mt-2"
                  type="email"
                  value={email}
                  onChange={event => setEmail(event.target.value)}
                  placeholder="alex.chen@test.leasemate.com.au"
                />
              </label>

              <label className="block text-sm font-medium text-stone-700">
                Display name
                <Input
                  className="mt-2"
                  value={name}
                  onChange={event => setName(event.target.value)}
                  placeholder="Alex Chen"
                />
              </label>

              <label className="block text-sm font-medium text-stone-700">
                Role
                <select
                  className="mt-2 flex h-10 w-full rounded-md border border-stone-200 bg-white px-3 text-sm text-stone-900 shadow-sm outline-none"
                  value={role}
                  onChange={event => setRole(event.target.value as LocalRole)}
                >
                  <option value="customer">Customer</option>
                  <option value="provider">Provider</option>
                  <option value="operator">Operator</option>
                  <option value="admin">Admin</option>
                </select>
              </label>

              <div className="flex gap-3 pt-2">
                <Button
                  type="submit"
                  className="rounded-md bg-stone-900 text-white hover:bg-stone-800"
                  disabled={loginMutation.isPending}
                >
                  {loginMutation.isPending ? "Signing In..." : "Sign In Locally"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="rounded-md"
                  onClick={() => {
                    setEmail("alex.chen@test.leasemate.com.au");
                    setName("Alex Chen");
                    setRole("customer");
                  }}
                >
                  Reset
                </Button>
              </div>
            </form>
          </section>

          <aside className="rounded-3xl border border-stone-200 bg-stone-50 p-8">
            <div className="mb-4">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-stone-500">
                Quick Users
              </p>
              <h2 className="mt-2 text-xl font-semibold text-stone-900">
                Existing database users
              </h2>
            </div>

            <div className="space-y-3">
              {usersLoading && (
                <div className="rounded-2xl border border-dashed border-stone-300 bg-white p-4 text-sm text-stone-500">
                  Loading users...
                </div>
              )}

              {!usersLoading && quickUsers.length === 0 && (
                <div className="rounded-2xl border border-dashed border-stone-300 bg-white p-4 text-sm text-stone-500">
                  No users found yet. Use the form to create your first local account.
                </div>
              )}

              {quickUsers.map(user => (
                <button
                  key={user.id}
                  type="button"
                  className="w-full rounded-2xl border border-stone-200 bg-white p-4 text-left transition-colors hover:border-stone-300"
                  onClick={() =>
                    loginMutation.mutate({
                      email: user.email ?? undefined,
                      openId: user.openId,
                      name: user.name ?? undefined,
                      role: user.role as LocalRole,
                    })
                  }
                  disabled={loginMutation.isPending}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <div className="text-sm font-semibold text-stone-900">
                        {user.name ?? user.email ?? user.openId}
                      </div>
                      <div className="mt-1 text-xs text-stone-500">
                        {user.email ?? user.openId}
                      </div>
                    </div>
                    <span className="rounded-full bg-stone-100 px-2.5 py-1 text-xs font-medium text-stone-700">
                      {user.role}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </aside>
        </div>
      </div>
    </PublicLayout>
  );
}
