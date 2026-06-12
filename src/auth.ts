import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { randomUUID } from "crypto";
import { prisma } from "@/lib/prisma";

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const email = credentials.email as string;
        const password = credentials.password as string;

        const user = await prisma.user.findUnique({
          where: { email: email.toLowerCase() },
        });

        if (!user) {
          return null;
        }

        const valid = await bcrypt.compare(password, user.password);
        if (!valid) {
          return null;
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          isGuest: false,
        };
      },
    }),
    Credentials({
      id: "guest",
      name: "guest",
      credentials: {},
      async authorize() {
        const guestId = randomUUID();
        const password = await bcrypt.hash(randomUUID(), 12);

        const user = await prisma.user.create({
          data: {
            name: "Guest Traveler",
            email: `guest-${guestId}@bharatyatra.local`,
            password,
          },
        });

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          isGuest: true,
        };
      },
    }),
  ],
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/sign-in",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.isGuest = Boolean(user.isGuest);
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user && token.id) {
        session.user.id = token.id as string;
        session.user.isGuest = Boolean(token.isGuest);
      }
      return session;
    },
  },
});
