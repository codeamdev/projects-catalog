import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { withTenantDb } from "@/db";
import { adminUsers } from "@/db/tenant-schema";
import { getTenantBySubdomain } from "./tenant";

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Contrasena", type: "password" },
        subdomain: { label: "Subdominio", type: "text" },
      },
      async authorize(credentials) {
        const { email, password, subdomain } = credentials as {
          email: string;
          password: string;
          subdomain: string;
        };

        const tenant = await getTenantBySubdomain(subdomain);
        if (!tenant) return null;

        const user = await withTenantDb(tenant.schemaName, (db) =>
          db
            .select()
            .from(adminUsers)
            .where(eq(adminUsers.email, email))
            .limit(1)
            .then((r) => r[0] ?? null)
        );

        if (!user) return null;
        if (!(await bcrypt.compare(password, user.password))) return null;

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          schemaName: tenant.schemaName,
          subdomain: tenant.subdomain,
          tenantName: tenant.name,
        };
      },
    }),
  ],
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        const u = user as Record<string, unknown>;
        token.role = u.role;
        token.schemaName = u.schemaName;
        token.subdomain = u.subdomain;
        token.tenantName = u.tenantName;
      }
      return token;
    },
    session({ session, token }) {
      session.user.role = token.role as string;
      session.user.schemaName = token.schemaName as string;
      session.user.subdomain = token.subdomain as string;
      session.user.tenantName = token.tenantName as string;
      return session;
    },
  },
  pages: { signIn: "/admin/login" },
  session: { strategy: "jwt" },
});

declare module "next-auth" {
  interface User {
    role?: string;
    schemaName?: string;
    subdomain?: string;
    tenantName?: string;
  }
  interface Session {
    user: {
      id?: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      role: string;
      schemaName: string;
      subdomain: string;
      tenantName: string;
    };
  }
}
