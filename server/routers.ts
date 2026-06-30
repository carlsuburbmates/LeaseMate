import { systemRouter } from "./_core/systemRouter.js";
import { router } from "./_core/trpc.js";
import { authRouter } from "./routers/auth.js";
import { intakeRouter } from "./routers/intake.js";
import { opsRouter } from "./routers/ops.js";
import { providerRouter } from "./routers/provider.js";
import { referenceRouter } from "./routers/reference.js";

export const appRouter = router({
  system: systemRouter,
  auth: authRouter,
  reference: referenceRouter,
  intake: intakeRouter,
  provider: providerRouter,
  ops: opsRouter,
});

export type AppRouter = typeof appRouter;
