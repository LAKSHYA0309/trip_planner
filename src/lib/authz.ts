import { auth } from "@/auth";

export async function requireUser() {
  const session = await auth();

  if (!session?.user?.id) {
    return null;
  }

  return {
    id: session.user.id,
    isGuest: Boolean(session.user.isGuest),
  };
}
