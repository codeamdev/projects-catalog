"use client";

import { useEffect } from "react";
import { signOut } from "next-auth/react";

interface Props {
  expires: string;   // ISO string de NextAuth (session.expires)
  loginPath: string;
}

export function SessionGuard({ expires, loginPath }: Props) {
  useEffect(() => {
    const expiresAt = new Date(expires).getTime();
    const remaining = expiresAt - Date.now();

    if (remaining <= 0) {
      signOut({ callbackUrl: loginPath });
      return;
    }

    // Timer exacto para cuando expira + revisión periódica de respaldo cada 30 s
    const timeout = setTimeout(() => signOut({ callbackUrl: loginPath }), remaining);
    const interval = setInterval(() => {
      if (Date.now() >= expiresAt) signOut({ callbackUrl: loginPath });
    }, 30_000);

    return () => {
      clearTimeout(timeout);
      clearInterval(interval);
    };
  }, [expires, loginPath]);

  return null;
}
