import { Suspense } from "react";
import { AuthForm } from "@/components/auth/auth-form";

export default function SignInPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4 py-16">
      <Suspense fallback={<div className="text-muted-foreground">Loading...</div>}>
        <AuthForm />
      </Suspense>
    </main>
  );
}
