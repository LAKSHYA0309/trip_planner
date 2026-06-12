"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import Link from "next/link";
import { Landmark, Loader2, UserRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function AuthForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/";

  const [mode, setMode] = useState<"sign-in" | "sign-up">("sign-in");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState<"credentials" | "guest" | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading("credentials");

    try {
      if (mode === "sign-up") {
        const res = await fetch("/api/auth/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name, email, password }),
        });

        const data = await res.json();
        if (!res.ok) {
          setError(data.error || "Registration failed.");
          setLoading(null);
          return;
        }
      }

      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError(
          mode === "sign-up"
            ? "Account created but sign in failed. Please try signing in."
            : "Invalid email or password.",
        );
        setLoading(null);
        return;
      }

      router.push(callbackUrl);
      router.refresh();
    } catch {
      setError("Something went wrong. Please try again.");
      setLoading(null);
    }
  }

  async function handleGuestSignIn() {
    setError("");
    setLoading("guest");

    try {
      const result = await signIn("guest", {
        redirect: false,
      });

      if (result?.error) {
        setError("Guest sign in failed. Please try again.");
        setLoading(null);
        return;
      }

      router.push(callbackUrl);
      router.refresh();
    } catch {
      setError("Guest sign in failed. Please try again.");
      setLoading(null);
    }
  }

  return (
    <div className="gold-border w-full max-w-md rounded-2xl bg-charcoal-light/90 p-8 shadow-2xl">
      <Link href="/" className="mb-8 flex items-center justify-center gap-2.5">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gold/10 ring-1 ring-gold/30">
          <Landmark className="h-5 w-5 text-gold" />
        </div>
        <div className="flex flex-col leading-none">
          <span className="text-sm font-bold tracking-[0.2em] text-white">
            BHARAT
          </span>
          <span className="text-[10px] font-medium tracking-[0.35em] text-gold">
            YATRA
          </span>
        </div>
      </Link>

      <div className="mb-6 flex rounded-lg bg-secondary p-1">
        <button
          type="button"
          onClick={() => {
            setMode("sign-in");
            setError("");
          }}
          className={`flex-1 rounded-md py-2 text-sm font-medium transition-colors ${
            mode === "sign-in"
              ? "bg-gold text-black"
              : "text-muted-foreground hover:text-white"
          }`}
        >
          Sign In
        </button>
        <button
          type="button"
          onClick={() => {
            setMode("sign-up");
            setError("");
          }}
          className={`flex-1 rounded-md py-2 text-sm font-medium transition-colors ${
            mode === "sign-up"
              ? "bg-gold text-black"
              : "text-muted-foreground hover:text-white"
          }`}
        >
          Sign Up
        </button>
      </div>

      <h1 className="font-heading text-2xl font-semibold text-white">
        {mode === "sign-in" ? "Welcome back" : "Create your account"}
      </h1>
      <p className="mt-2 text-sm text-muted-foreground">
        {mode === "sign-in"
          ? "Sign in to generate AI-powered India itineraries."
          : "Join BharatYatra to plan your perfect India trip."}
      </p>

      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        {mode === "sign-up" && (
          <div>
            <label className="mb-1.5 block text-xs text-muted-foreground">
              Full Name
            </label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Priya Sharma"
              disabled={loading !== null}
              className="h-11 border-white/10 bg-black/40 text-white placeholder:text-white/30"
            />
          </div>
        )}
        <div>
          <label className="mb-1.5 block text-xs text-muted-foreground">
            Email
          </label>
          <Input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            required
            disabled={loading !== null}
            className="h-11 border-white/10 bg-black/40 text-white placeholder:text-white/30"
          />
        </div>
        <div>
          <label className="mb-1.5 block text-xs text-muted-foreground">
            Password
          </label>
          <Input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder={mode === "sign-up" ? "Min. 8 characters" : "••••••••"}
            required
            minLength={mode === "sign-up" ? 8 : 1}
            disabled={loading !== null}
            className="h-11 border-white/10 bg-black/40 text-white placeholder:text-white/30"
          />
        </div>

        {error && (
          <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-red-400">
            {error}
          </p>
        )}

        <Button
          type="submit"
          disabled={loading !== null}
          className="h-11 w-full bg-gold font-semibold text-black hover:bg-gold-light"
        >
          {loading === "credentials" ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Please wait...
            </>
          ) : mode === "sign-in" ? (
            "Sign In"
          ) : (
            "Create Account"
          )}
        </Button>
      </form>

      <div className="my-5 flex items-center gap-3">
        <div className="h-px flex-1 bg-white/10" />
        <span className="text-xs text-muted-foreground">or</span>
        <div className="h-px flex-1 bg-white/10" />
      </div>

      <Button
        type="button"
        variant="outline"
        disabled={loading !== null}
        onClick={handleGuestSignIn}
        className="h-11 w-full border-white/10 bg-black/20 text-white hover:bg-white/5 hover:text-white"
      >
        {loading === "guest" ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Starting guest trip...
          </>
        ) : (
          <>
            <UserRound className="mr-2 h-4 w-4 text-gold" />
            Continue as Guest
          </>
        )}
      </Button>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        <Link href="/" className="text-gold hover:text-gold-light">
          ← Back to homepage
        </Link>
      </p>
    </div>
  );
}
