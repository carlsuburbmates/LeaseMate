import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import type { User } from "../../drizzle/schema.js";
import { sdk } from "./sdk.js";

type HeaderValue = string | string[] | undefined;

export type TrpcRequest = {
  protocol?: string;
  headers: Record<string, HeaderValue>;
};

export type TrpcResponse = {
  cookie: (name: string, value: string, options?: unknown) => unknown;
  clearCookie: (name: string, options?: unknown) => unknown;
};

export type TrpcContext = {
  req: TrpcRequest;
  res: TrpcResponse;
  user: User | null;
};

export async function createContext(
  opts: CreateExpressContextOptions
): Promise<TrpcContext> {
  let user: User | null = null;

  try {
    user = await sdk.authenticateRequest(opts.req);
  } catch (error) {
    // Authentication is optional for public procedures.
    user = null;
  }

  return {
    req: opts.req as unknown as TrpcRequest,
    res: opts.res as unknown as TrpcResponse,
    user,
  };
}
