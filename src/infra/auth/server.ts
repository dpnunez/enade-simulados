import { prismaAdapter } from "better-auth/adapters/prisma";
import { betterAuth } from "better-auth";
import { nextCookies } from "better-auth/next-js";

import { prisma } from "@infra/db/prisma";
import { env } from "@infra/env";
import { getAppBaseUrl, getAppBaseUrlHost } from "@infra/url/app-base-url";

export const auth = betterAuth({
  baseURL: {
    allowedHosts: [getAppBaseUrlHost(), "localhost:*", "*.vercel.app"],
    protocol: "auto",
    fallback: getAppBaseUrl(),
  },
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),
  emailAndPassword: {
    enabled: true,
    disableSignUp: true,
  },
  rateLimit: {
    enabled: !env.BETTER_AUTH_RATE_LIMIT_DISABLED,
  },
  user: {
    additionalFields: {
      role: {
        type: "string",
        input: false,
      },
    },
  },
  session: {
    cookieCache: {
      enabled: true,
      maxAge: 5 * 60,
    },
  },
  plugins: [nextCookies()],
});

export type Session = typeof auth.$Infer.Session;
