"use server";
import {
  CATEGORIES,
  transactionSchema,
} from "@/constants/transaction-constants";
import { createAI } from "./instance";
import { Content } from "@google/genai";
import { createTransaction } from "../transaction/action";

export async function extractReceiptData(formData: FormData) {
  const file = formData.get("file") as File;
  if (!file) {
    throw new Error("No File upload");
  }

  const mimeType = file.type;
  const base64Data = Buffer.from(await file.arrayBuffer()).toString("base64");
  const ai = createAI();
  const contents: Content[] = [
    {
      role: "user",
      parts: [
        {
          inlineData: {
            mimeType,
            data: base64Data,
          },
        },
        {
          text: `   
                <role>
                    You are an AI Wizard finance assistant, who can extract transaction details from receipt.
                </role>

                <Instruction>
                Extract transaction details from the receipt text and return it as a structure JSON object.
                The JSON object must have exactly these fileds:
                -"amount": a number representing the cost (positive). Use 0 if not provided.
                -"type": type of transaction, either 'income' or 'expense'
                -"category": choose the most appropriate category from this exact list:
                 ${CATEGORIES.join(",")}. If category not define, you can use 'Other'
                -"description": a short string describing of transaction, first letter capitalized.
                -"date": date of transaction in YYYY-MM-DD format.
                        Assume the current date if relative terms like 'today' or 'just now'. If not define use current date
                </Instruction>

                <Context>
                Current Date: ${new Date().toISOString()}
                </Context>

                <outputFormat>
                    Respond with only the raw JSON object, no markdown blocks, no text before or after.
                </outputFormat>
                `,
        },
      ],
    },
  ];

  const response = await ai.models.generateContent({
    model: "gemini-3.5-flash",
    contents,
  });
  if (!response.text) {
    throw new Error("AI cannot generate data");
  }

  const transaction = transactionSchema.parse(JSON.parse(`${response.text}`));

  //   return transaction;
  //save to DB
  await createTransaction(transaction);
  return "crate transaction success";
}
