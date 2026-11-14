import { FunctionDeclaration, Type } from "@google/genai";

export const transactionProperties = {
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

export const getTransactionDeclaration: FunctionDeclaration = {
  name: "get_transaction",
  description: "get all transaction from the users financial history",
  parameters: {
    type: Type.OBJECT,
    properties: transactionProperties,
  },
};

export const createTransactionDeclaration: FunctionDeclaration = {
  name: "create_transaction",
  description:
    "Create a new transaction in the user's financial history based on by provided details",
  parameters: {
    type: Type.OBJECT,
    properties: transactionProperties,
    required: ["amount", "description", "type", "category", "date"],
  },
};

export const deleteTransactionDeclaration: FunctionDeclaration = {
  name: "delete_transaction",
  description:
    "Delete an existing transaction from user's financial history based on the provided data.",
  parameters: {
    type: Type.OBJECT,
    properties: transactionProperties,
  },
};

export const updateTransactionDeclaration: FunctionDeclaration = {
  name: "update_transaction",
  description:
    "Update an existing transaction from user's financial history based on the provided data.",
  parameters: {
    type: Type.OBJECT,
    properties: transactionProperties,
  },
};
