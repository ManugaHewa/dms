import { z } from "zod";

export const DonationInput = z.object({
  donorId: z.string().cuid().nullable().optional(),
  causeId: z.string().cuid(),
  type: z.enum(["CASH","CHEQUE","CARD","INTERAC","EFT","CANADAHELPS","IN_KIND"]),
  currency: z.string().default("CAD"),
  grossAmount: z.number().nonnegative(),
  processorFee: z.number().nonnegative().optional(),
  remarksDonor: z.string().max(1000).optional()
});
export type DonationInputT = z.infer<typeof DonationInput>;
