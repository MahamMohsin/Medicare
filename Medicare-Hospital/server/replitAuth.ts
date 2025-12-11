import * as client from "openid-client";
import { Strategy, type VerifyFunction } from "openid-client/passport";
import passport from "passport";
import session from "express-session";
import type { Express, RequestHandler } from "express";
import memoize from "memoizee";
import connectPgSimple from "connect-pg-simple";
import { pool } from "./db";
import { storage } from "./storage";

if (!process.env.REPLIT_DEPLOYMENT && !process.env.ISSUER_URL) {
  console.warn("Running outside of Replit deployment without ISSUER_URL set");
}

if (!process.env.SESSION_SECRET) {
  console.warn("SESSION_SECRET is not set, using fallback");
}

const getOidcConfig = memoize(
  async () => {
    const issuerUrl = process.env.ISSUER_URL ?? "https://replit.com/oidc";
    return await client.discovery(new URL(issuerUrl), process.env.REPLIT_DEPLOYMENT_ID!);
  },
  { maxAge: 3600 * 1000 }
);

export async function setupAuth(app: Express) {
  const PgSession = connectPgSimple(session);
  
  app.set("trust proxy", 1);
  
  app.use(
    session({
      store: new PgSession({
        pool,
        createTableIfMissing: true,
      }),
      secret: process.env.SESSION_SECRET || "medicare-hospital-secret-key",
      resave: false,
      saveUninitialized: false,
      cookie: {
        httpOnly: true,
        secure: process.env.REPLIT_DEPLOYMENT === "1",
        maxAge: 7 * 24 * 60 * 60 * 1000,
      },
    })
  );

  app.use(passport.initialize());
  app.use(passport.session());

  if (process.env.REPLIT_DEPLOYMENT_ID) {
    const config = await getOidcConfig();

    const verify: VerifyFunction = async (tokens: client.TokenEndpointResponse & client.TokenEndpointResponseHelpers, verified: passport.AuthenticateCallback) => {
      try {
        const claims = tokens.claims();
        if (!claims) {
          return verified(new Error("No claims in token"));
        }

        const userInfo = {
          id: claims.sub,
          email: claims.email as string | undefined,
          firstName: claims.given_name as string | undefined,
          lastName: claims.family_name as string | undefined,
          profileImageUrl: claims.picture as string | undefined,
        };

        const user = await storage.upsertUser(userInfo);
        verified(null, user);
      } catch (error) {
        verified(error as Error);
      }
    };

    const strategy = new Strategy(
      {
        config,
        scope: "openid email profile",
        callbackURL: "/api/callback",
      },
      verify
    );

    passport.use(strategy);
  }

  passport.serializeUser((user: any, done) => {
    done(null, user.id);
  });

  passport.deserializeUser(async (id: string, done) => {
    try {
      const user = await storage.getUser(id);
      done(null, user);
    } catch (error) {
      done(error);
    }
  });

  app.get("/api/login", (req, res, next) => {
    if (!process.env.REPLIT_DEPLOYMENT_ID) {
      return res.redirect("/");
    }
    passport.authenticate("openid-client", {
      prompt: "login consent",
    })(req, res, next);
  });

  app.get("/api/callback", (req, res, next) => {
    passport.authenticate("openid-client", {
      successRedirect: "/",
      failureRedirect: "/api/login",
    })(req, res, next);
  });

  app.get("/api/logout", (req, res) => {
    req.logout(() => {
      res.redirect("/");
    });
  });
}

export const isAuthenticated: RequestHandler = (req, res, next) => {
  if (!process.env.REPLIT_DEPLOYMENT_ID) {
    (req as any).userId = "demo-user";
    return next();
  }

  if (req.isAuthenticated()) {
    (req as any).userId = (req.user as any).id;
    return next();
  }

  res.status(401).json({ error: "Unauthorized" });
};
