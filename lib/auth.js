import bcrypt from "bcryptjs";
import NextAuth, { CredentialsSignin } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { connectDB } from "@/lib/db";
import { getClientIp, hashIp, MINUTE, rateLimit } from "@/lib/rateLimit";
import User from "@/models/User";

// Used when the email is unknown, so a failed login takes the same time either way.
const DUMMY_HASH = bcrypt.hashSync("not-a-real-password", 10);

class TooManyAttempts extends CredentialsSignin {
  code = "too_many_attempts";
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  trustHost: true,
  session: { strategy: "jwt", maxAge: 30 * 24 * 60 * 60 },
  pages: { signIn: "/login" },
  logger: {
    // A wrong password is expected, not a server error worth logging.
    error(err) {
      if (err?.type === "CredentialsSignin") return;
      console.error("[auth]", err);
    },
  },
  providers: [
    Credentials({
      credentials: { email: {}, password: {} },
      async authorize(credentials, request) {
        const email = String(credentials?.email || "").trim().toLowerCase();
        const password = String(credentials?.password || "");
        if (!email || !password) return null;

        const rl = await rateLimit(`login:${hashIp(getClientIp(request))}:${email}`, {
          limit: 10,
          windowMs: 15 * MINUTE,
        });
        if (!rl.ok) throw new TooManyAttempts();

        await connectDB();
        const user = await User.findOne({ email }).lean();
        const ok = await bcrypt.compare(password, user?.passwordHash || DUMMY_HASH);
        if (!user || !ok) return null;

        return { id: String(user._id), name: user.name, email: user.email, role: user.role };
      },
    }),
  ],
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.uid = user.id;
        token.role = user.role;
      }
      return token;
    },
    session({ session, token }) {
      session.user.id = token.uid;
      session.user.role = token.role;
      return session;
    },
  },
});
