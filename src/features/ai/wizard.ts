"use server";

import z from "zod";
import { createAI } from "./instance";
import { FunctionDeclaration, Type } from "@google/genai";
import { createTransaction, deleteTransaction } from "../transaction/action";
import { findEmbedding } from "./embedding";

const transactionSchema = z.object({
  amount: z.number().default(0).describe("Transcation nominal"),
  type: z.enum(["income", "expense"]).describe("Type of transcation"),
  category: z
    .enum([
      "Food & Drink",
      "Transportation",
      "Entertaiment",
      "Shopping",
      "Housing",
      "Salary",
      "Others",
    ])
    .describe("Category of transcation"),
  description: z.string().describe("Short text describing transcation"),
  date: z.string().describe("the date of transcation YYYY-MM-DD format"),
});

export async function handleWizardInput(message: string) {
  const contents = `
  <role>
    You are an AI Wizard finance assistant, who can extract transcation details from text.
  </role>

  <Instruction>
  Extract transcation details from the following text and return it as a structure JSON object.
  The JSON object must have exactly these fileds:
  -"amount": a number representing the cost (positive). Use 0 if not provided.
  -"type": type of transcation, either 'income' or 'expense'
  -"category": choose the most appropriate category from this exact list:
      "Food & Drink", "Transportation", "Entertaiment", "Shopping", "Housing", "Salary", "Other".
  -"description": a short string describing of transcation, first letter capitalized.
  -"date": date of transcation in YYYY-MM-DD format.
          Assume the current date if relative terms like 'today' or 'just now'. If not define use current date
  </Instruction>

  <Context>
  Current Date: ${new Date().toISOString()}
  </Context>

  <input>
  Text to extract: ${message}
  </input>

  <outputFormat>
    Respond with only the raw JSON object, no markdown blocks, no text before or after.
  </outputFormat>
  `;

  const ai = createAI();
  const response = await ai.models.generateContent({
    model: "gemini-3.5-flash",
    contents,
    config: {
      responseMimeType: "application/json",
      responseSchema: z.toJSONSchema(transactionSchema),
    },
  });

  const transcation = transactionSchema.parse(JSON.parse(`${response.text}`));
  if (transcation.amount <= 0) {
    throw new Error("Can't crate transcation with invalid amount");
  }
  return "crate transcation success";
}

const transactionProperties = {
  id: {
    type: Type.STRING,
    description: "The unique identifier of the transaction",
  },
  amount: {
    type: Type.NUMBER,
    description: "Amount based on  transaction",
  },
  type: {
    type: Type.STRING,
    enum: ["income", "expense"],
    description: 'The type of the transaction, either "income" or "expense"',
  },
  category: {
    type: Type.STRING,
    enum: [
      "Food & Drink",
      "Transportation",
      "Entertaiment",
      "Shopping",
      "Housing",
      "Salary",
      "Others",
    ],
    description: "the category from the transaction",
  },
  description: {
    type: Type.STRING,
    description: "Total summary based on transaction, first letter capitalized",
  },
  date: {
    type: Type.STRING,
    description: 'The date of the transaction in a format "YYYY-MM-DD"',
  },
};

const createTransactionDeclaration: FunctionDeclaration = {
  name: "create_transaction",
  description:
    "Create a new transaction in the user's financial history based on by provided details",
  parameters: {
    type: Type.OBJECT,
    properties: transactionProperties,
    required: ["amount", "description", "type", "category", "date"],
  },
};

const deleteTransactionDeclaration: FunctionDeclaration = {
  name: "delete_transaction",
  description:
    "Delete an existing transaction from user's financial history based on the provided data.",
  parameters: {
    type: Type.OBJECT,
    properties: transactionProperties,
  },
};

export async function handleWizardTools(message: string) {
  const contents = `
    <role>
        You are an AI Wizard finance assistant, who can extract transcation details from text.
    </role>

    <Instruction>
    Extract transcation details from the following text.
    </Instruction>

    <Context>
    Current Date: ${new Date().toISOString()}
    </Context>

    <input>
    Text to extract: ${message}
    </input>

  `;
  const ai = createAI();
  const response = await ai.models.generateContent({
    model: "gemini-3.5-flash",
    contents,
    config: {
      tools: [
        {
          functionDeclarations: [
            createTransactionDeclaration,
            deleteTransactionDeclaration,
          ],
        },
      ],
    },
  });

  if (response.functionCalls && response.functionCalls.length > 0) {
    await Promise.all(
      response.functionCalls.map(async (functionCall) => {
        const args = functionCall.args;
        if (!args) {
          throw new Error("No arguments provided for create transcations");
        }
        switch (functionCall.name) {
          case "create_transaction":
            const transaction = transactionSchema.parse(args);
            if (transaction.amount <= 0) {
              throw new Error("Cannot create transaction with invalid amount");
            }
            await createTransaction(transaction);
            break;
          case "delete_transaction":
            const data = await findEmbedding(JSON.stringify(args), 0.9, 1);
            const deletedData = data[0];
            await deleteTransaction(deletedData.id);
            break;
          default:
            throw new Error(`unknown function call`);
        }
      }),
    );

    return "Function executed successfully";
  } else {
    throw new Error("ai does not call any function");
  }
}
