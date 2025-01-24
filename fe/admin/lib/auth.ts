import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import {verifyAccount} from '@/lib/db/account';

export const {
  auth,
  handlers,
  signIn,
  signOut,
} = NextAuth({
  pages: {
    signIn: '/login',
  },
  providers: [
    Credentials({
      credentials: {
        username: {label: 'Username', type: 'text'},
        password: {label: 'Password', type: 'password'},
      },
      async authorize(credentials: Partial<Record<"username" | "password", unknown>>) {
        if (!credentials?.username || !credentials?.password) {
          return null;
        }

        const account = await verifyAccount(
          credentials.username as string,
          credentials.password as string
        );

        if (!account) {
          return null;
        }

        return {
          id: account.id.toString(),
          name: account.name,
          email: account.email,
          image: account.pic || null,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({token, user}) {
      if (user) {
        token.id = user.id;
      }
      return token;
    },
    async session({session, token}) {
      if (token && session.user) {
        session.user.id = token.id as string;
      }
      return session;
    },
  },
  session: {
    strategy: 'jwt',
  },
});
