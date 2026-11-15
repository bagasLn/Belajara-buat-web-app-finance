import z from "zod";

export const CATEGORIES = [
  "Food & Drink",
  "Transportation",
  "Entertaiment",
  "Shopping",
  "Housing",
  "Salary",
  "Other",
];

export const transactionSchema = z.object({
  amount: z.number().default(0).describe("Transcation nominal"),
  type: z.enum(["income", "expense"]).describe("Type of transcation"),
  category: z.enum(CATEGORIES).describe("Category of transcation"),
  description: z.string().describe("Short text describing transcation"),
  date: z.string().describe("the date of transcation YYYY-MM-DD format"),
});
