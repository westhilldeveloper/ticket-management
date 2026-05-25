// src/app/api/auth/[...nextauth]/route.js
import NextAuth from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';

export const authOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'text' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        // Your custom logic
        const user = { id: '1', name: 'Admin', email: credentials.email };
        if (credentials.password === 'password') return user;
        return null;
      },
    }),
  ],
  secret: process.env.NEXTAUTH_SECRET,
  session: { strategy: 'jwt' },
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };