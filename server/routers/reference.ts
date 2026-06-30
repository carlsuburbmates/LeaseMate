import { z } from "zod/v4";
import {
  getAllSuburbs,
  getProductsByCategory,
  getServiceCategories,
  searchSuburbs,
} from "../db.js";
import { publicProcedure, router } from "../_core/trpc.js";
import { EXCEPTION_META, operatorProcedure } from "./shared.js";

export const referenceRouter = router({
  suburbs: publicProcedure.query(() => getAllSuburbs()),
  searchSuburbs: publicProcedure
    .input(z.object({ query: z.string() }))
    .query(({ input }) => searchSuburbs(input.query)),
  categories: publicProcedure.query(() => getServiceCategories()),
  productsByCategory: publicProcedure
    .input(z.object({ categoryId: z.number() }))
    .query(({ input }) => getProductsByCategory(input.categoryId)),
  exceptionMeta: operatorProcedure.query(() => EXCEPTION_META),
});
