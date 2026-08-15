import * as z from "zod";

// RCF 9457 problem + json. Single error shape for all PetLife api responses
export const problemSchema = z.object({
  type: z.string(),
  title: z.string(),
  status: z.number().int().min(400).max(599),
  detail: z.string().optional(),
  instance: z.string(),
  requestId: z.union([z.string(), z.number()]),
  errors: z.record(z.string(), z.array(z.string()).optional()).optional(),
});

export type Problem = z.infer<typeof problemSchema>;
