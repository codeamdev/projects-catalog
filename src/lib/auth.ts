import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { withTenantDb, publicDb } from "@/db";
import { adminUsers } from "@/db/tenant-schema";
import { superAdmins } from "@/db/public-schema";
import { getTenantBySubdomain } from "./tenant";

export const { handlers, auth, signIn, signOut } = NextAuth({
  trustHost: true,
  providers: [
    // Provider para admins de tenant (login en /admin)
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Contraseña", type: "password" },
        subdomain: { label: "Subdominio", type: "text" },
      },
      async authorize(credentials) {
        const { email, password, subdomain } = credentials as {
          email: string;
          password: string;
          subdomain: string;
        };

        const tenant = await getTenantBySubdomain(subdomain);
        if (!tenant) {
          console.warn("[auth/admin] tenant no encontrado para subdominio:", subdomain);
          return null;
        }

        const user = await withTenantDb(tenant.schemaName, (db) =>
          db
            .select()
            .from(adminUsers)
            .where(eq(adminUsers.email, email))
            .limit(1)
            .then((r) => r[0] ?? null)
        );

        if (!user) {
          console.warn("[auth/admin] usuario no encontrado:", email, "en schema:", tenant.schemaName);
          return null;
        }

        const ok = await bcrypt.compare(password, user.password);
        if (!ok) {
          console.warn("[auth/admin] contraseña incorrecta para:", email);
          return null;
        }

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

    // Provider para superadmin global (login en /superadmin/login)
    Credentials({
      id: "superadmin",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Contraseña", type: "password" },
      },
      async authorize(credentials) {
        const { email, password } = credentials as {
          email: string;
          password: string;
        };

        const admin = await publicDb
          .select()
          .from(superAdmins)
          .where(eq(superAdmins.email, email))
          .limit(1)
          .then((r) => r[0] ?? null);

        if (!admin) {
          console.warn("[auth/superadmin] usuario no encontrado:", email);
          return null;
        }

        const ok = await bcrypt.compare(password, admin.password);
        if (!ok) {
          console.warn("[auth/superadmin] contraseña incorrecta para:", email);
          return null;
        }

        return {
          id: admin.id,
          email: admin.email,
          name: admin.name,
          role: "SUPER_ADMIN",
          schemaName: "",
          subdomain: "",
          tenantName: "",
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
  session: {
    strategy: "jwt",
    maxAge: 60 * 60,      // token expira 60 min después del último uso
    updateAge: 5 * 60,    // se renueva si quedan menos de 5 min (sesión deslizante)
  },
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
