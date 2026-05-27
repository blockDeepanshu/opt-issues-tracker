import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { connectMongo } from "@/lib/db";
import { User } from "@/lib/models/user";

export const { handlers, auth, signIn, signOut } = NextAuth({
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  providers: [
    Google({
      clientId: process.env.AUTH_GOOGLE_ID,
      clientSecret: process.env.AUTH_GOOGLE_SECRET,
    }),
  ],
  callbacks: {
    async signIn({ user }) {
      if (!user.email) return false;

      await connectMongo();
      await User.updateOne(
        { email: user.email },
        {
          $set: {
            name: user.name ?? user.email.split("@")[0],
            email: user.email,
            image: user.image,
          },
          $setOnInsert: { createdAt: new Date() },
        },
        { upsert: true },
      );

      return true;
    },
    async jwt({ token }) {
      if (!token.email) return token;

      await connectMongo();
      const dbUser = await User.findOne({ email: token.email })
        .select("_id name image")
        .lean();
      if (dbUser) {
        token.id = dbUser._id.toString();
        token.name = dbUser.name;
        token.picture = dbUser.image;
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
      }
      return session;
    },
    authorized({ auth: session, request }) {
      const isLoggedIn = Boolean(session?.user);
      const isAuthPage = request.nextUrl.pathname.startsWith("/login");
      if (isAuthPage) return !isLoggedIn;
      return isLoggedIn;
    },
  },
});
