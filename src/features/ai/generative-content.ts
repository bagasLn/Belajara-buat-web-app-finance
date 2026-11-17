"use server";

import { Type } from "@google/genai";
import { findEmbedding } from "./embedding";
import { createAI } from "./instance";
import { CardDescription } from "@/components/ui/card";
import { Transaction } from "@/app/types/transaction";

export async function generateChat(request: string) {
  const ai = createAI();

  const data = await findEmbedding(request, 0.5, 50);

  let contextData = "";

  if (!data || data.length === 0) {
    contextData =
      "No transaction found that area similar or relevant to the request";
  } else {
    contextData = data
      .map((transaction: Transaction) => {
        return JSON.stringify(transaction);
      })
      .join("\n");
  }

  const contents = {
    role: "user",
    parts: [
      {
        text: `
  <Role>
  You are an AI Financial analyst and data engineering spesialist. You ask is analyst transaction in <context>
  and generate structured JSON configuration to render chart that directly respon the user request
  </Role>

  <input>
  User request: '${request}'
  </input>

  <instruction>
  - analyze and filter:read the users requerst and extract only the relevant transaction from the provided <context>
  - Grouping summarization:
    *If the query is about expense type,  group by category name.
    *If it's about time trend group by date, day, or month.
    *If it's comparing income and expense, group by type.
    *Limit the data to the top 10 most significant groups to answer the chart is clean on the dashboard, group smaller items into "Others" if necessary.
  - Values & Calculations: Ensure all currancy values are aggregated correctly. Use positive numbers for visual chart representation.
  - Chart Type Selection:
    * Use ' charttype: "pie" if the users asks for proportions, ratios, percentages, or category composition.
    * Use ' charttype: "bar" if the users asks for comparation, over-time trends, chronologcal analysis, or comparing individual entities.
  </instruction>

  <Context>
  - Current Date : ${new Date().toDateString()}
  - Data Transaction : ${contextData}
  </Context>

  <Constraints>
  - Respon stricly with a raw and valid JSON object matching the requested schema
  - Do not include markdown code blocks, bakcticks, or any conversation text
  </Constraints>
  `,
      },
    ],
  };

  const response = await ai.models.generateContent({
    model: "gemini-3.5-flash",
    contents,
    config: {
      responseMimeType: "application/json",
      responseJsonSchema: {
        type: Type.OBJECT,
        properties: {
          chartType: {
            type: Type.STRING,
            enum: ["bar", "pie"],
            description: " Chart type to render",
          },
          data: {
            type: Type.ARRAY,
            description: " Array of objcet data chart",
            items: {
              type: Type.OBJECT,
              properties: {
                name: { type: Type.STRING },
                value: { type: Type.NUMBER },
              },
              required: ["name", "value"],
            },
          },
        },
        required: ["chartType", "data"],
      },
    },
  });

  if (!response.text) {
    throw new Error("Failed ot generate chart");
  }

  const chartData = JSON.parse(response.text);

  return chartData;
}

//********** */
// function untuk generate image dengan model yang berbayar
// export async function generateImage(request: string) {
//   const ai = createAI();

//   const data = await findEmbedding(request, 0.5, 50);

//   let contextData = "";

//   if (!data || data.length === 0) {
//     contextData =
//       "No transaction found that area similar or relevant to the request";
//   } else {
//     contextData = data
//       .map((transaction: Transaction) => {
//         return JSON.stringify(transaction);
//       })
//       .join("\n");
//   }

//   const contents = {
//     role: "user",
//     parts: [
//       {
//         text: `
//   <Role>
//   You are an AI Financial analyst and data illustrator. You ask is analyst transaction in <context>
//   and generate an image for inforgrafic and conceptual dashboard in bento grid style that directly respon the user request
//   </Role>

//   <input>
//   User request: '${request}'
//   </input>

//   <instruction>
//   - analyze and filter:read the users requerst and extract only the relevant transaction from the provided <context>
//   - Grouping summarization:
//     *If the query is about expense type,  group by category name.
//     *If it's about time trend group by date, day, or month.
//     *If it's comparing income and expense, group by type.
//     *Limit the data to the top 10 most significant groups to answer the chart is clean on the dashboard, group smaller items into "Others" if necessary.
//   - Values & Calculations: Ensure all currancy values are aggregated correctly. Use positive numbers for visual chart representation.
//   - Chart Type Selection:
//     * Use ' charttype: "pie" if the users asks for proportions, ratios, percentages, or category composition.
//     * Use ' charttype: "bar" if the users asks for comparation, over-time trends, chronologcal analysis, or comparing individual entities.
//   - Create a visualy standing bento-style design
//   </instruction>

//   <Context>
//   - Current Date : ${new Date().toDateString()}
//   - Data Transaction : ${contextData}
//   </Context>
//   `,
//       },
//     ],
//   };

//   const response = await ai.models.generateContent({
//     model: "gemini-2.5-flash-image",
//     contents,
//     config: {
//       imageConfig: {
//         aspectRatio: "16:9",
//       },
//     },
//   });
//   const candidates = response.candidates;
//   if (!candidates || candidates.length === 0) {
//     throw new Error("Failed to generate image");
//   }

//   const parts = candidates[0].content?.parts;
//   if (!parts) {
//     throw new Error("Failed to generate image");
//   }

//   let base64Image = "";

//   for (const part of parts) {
//     if (!part.inlineData) {
//       const imageData = part.inlineData.data;
//       if (imageData) {
//         base64Image = `data :${part.inlineData.mimeType || "Image/png"} base64,${imageData}`;
//       }
//     }
//   }

//   return base64Image;
// }
