import { systemRouter } from "./_core/systemRouter";
import { router } from "./_core/trpc";
import { authRouter } from "./routers/auth";
import { intakeRouter } from "./routers/intake";
import { opsRouter } from "./routers/ops";
import { providerRouter } from "./routers/provider";
import { referenceRouter } from "./routers/reference";

export const appRouter = router({
  system: systemRouter,
  auth: authRouter,
  reference: referenceRouter,
  intake: intakeRouter,
  provider: providerRouter,
  ops: opsRouter,
});

export type AppRouter = typeof appRouter;
