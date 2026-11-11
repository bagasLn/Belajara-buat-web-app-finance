"use server";

import z from "zod";
import { createAI } from "./instance";
import { Content } from "@google/genai";
import {
  createTransaction,
  deleteTransaction,
  updateTransaction,
} from "../transaction/action";
import { findEmbedding } from "./embedding";
import {
  createTransactionDeclaration,
  deleteTransactionDeclaration,
  getTransactionDeclaration,
  updateTransactionDeclaration,
} from "./functionTransaction";

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
  const contents: Content[] = [
    {
      role: "user",
      parts: [
        {
          text: `
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
                `,
        },
      ],
    },
  ];

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

export async function handleWizardTools(message: string) {
  const contents: Content[] = [
    {
      role: "user",
      parts: [
        {
          text: `
  
    <role>
        You are an AI Wizard finance assistant, who can extract transcation details from text.
    </role>

    <Instruction>
    - Extract transcation details from the following text.
    - If request is to update or delete transaction, you must call function get_transaction first to find out which transaction will be update or delete
    - When update transaction, args mus return from get_transaction before  with fully like in schema
    - The final respone if there are no more function being called is as simple as possible
    </Instruction>

    <Context>
    Current Date: ${new Date().toISOString()}
    </Context>

    <input>
    Text to extract: ${message}
    </input>

  `,
        },
      ],
    },
  ];

  const ai = createAI();

  let running = true;
  while (running) {
    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents,
      config: {
        tools: [
          {
            functionDeclarations: [
              getTransactionDeclaration,
              createTransactionDeclaration,
              deleteTransactionDeclaration,
              updateTransactionDeclaration,
            ],
          },
        ],
      },
    });

    if (response.functionCalls && response.functionCalls.length > 0) {
      if (response.candidates && response.candidates[0]?.content) {
        contents.push(response.candidates[0].content);
      }
      const functionResponseParts = await Promise.all(
        response.functionCalls.map(async (functionCall) => {
          const { name, args, id } = functionCall;
          if (!args) {
            throw new Error("No arguments provided for create transcations");
          }

          let resultData = {};

          switch (name) {
            case "get_transaction":
              const dataFind = await findEmbedding(
                JSON.stringify(args),
                0.9,
                1,
              );
              resultData = dataFind[0] || {};
              break;

            case "create_transaction":
              const transaction = transactionSchema.parse(args);
              if (transaction.amount <= 0) {
                throw new Error(
                  "Cannot create transaction with invalid amount",
                );
              }
              await createTransaction(transaction);
              break;

            case "delete_transaction":
              await deleteTransaction(`${args.id}`);
              break;

            case "update_transaction":
              const newData = transactionSchema.parse(args);
              if (newData.amount <= 0) {
                throw new Error(
                  "cannot update transaction with invalid amount",
                );
              }
              await updateTransaction(`${args.id}`, newData);
              break;

            default:
              throw new Error(`unknown function call`);
          }

          return {
            functionResponse: {
              name,
              response: { result: resultData },
              id,
            },
          };
        }),
      );

      contents.push({
        role: "user",
        parts: functionResponseParts,
      });
    } else {
      running = false;
      return response.text;
    }
  }
}
