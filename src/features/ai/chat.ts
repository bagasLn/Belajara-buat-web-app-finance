"use server";

import { Conversation } from "@/app/types/ai";
import { createAI } from "./instance";
import z from "zod";
import { findEmbedding } from "./embedding";
import { Content, FunctionCall, Part } from "@google/genai";
import { getTransactionDeclaration } from "./functionTransaction";

export async function handleChat(
  conversation: Conversation[],
  isThinking: boolean,
) {
  const ai = createAI();
  const response = await ai.models.generateContent({
    model: "gemini-3.5-flash",
    contents: [...conversation],
    config: {
      thinkingConfig: {
        includeThoughts: isThinking,
      },
    },
  });

  const result = {
    thought: "",
    answer: "",
  };

  if (isThinking) {
    const parts = response.candidates?.[0].content?.parts;
    if (!parts) {
      return;
    }

    for (const part of parts) {
      if (!part.text) {
        continue;
      } else if (part.thought) {
        result.thought += part.text;
      } else {
        result.answer += part.text;
      }
    }
  } else {
    result.answer = `${response.text}`;
  }

  return result;
}

async function generalChat(conversation: Content[], isThinking?: boolean) {
  const ai = createAI();
  const response = await ai.models.generateContentStream({
    model: "gemini-2.5-flash",
    contents: [...conversation],
    config: {
      thinkingConfig: {
        includeThoughts: isThinking,
        // thinkingLevel: isThinking ? ThinkingLevel.HIGH : ThinkingLevel.MINIMAL,
        // thinkingBudget: isThinking ? -1 : 0,
      },
      tools: [
        {
          googleSearch: {},
          urlContext: {},
        },
      ],

      // mengatur bot atau ai, untuk merespon menjadi spesifik sesuai web yang di develop
      systemInstruction: `
     [Role]
      Kamu adalah Finabot seorang financial advisor, yang punya gaya bahasa sopan dan suka
      memberikan analogi sehari-hari agar penjelasan rumit jadi lebih mudah dipahami.
      
       [Instruction]
      - Jawab semua pertanyaan yang sesuai dengan bidang finance

      [Context]
      Kamu bekerja untuk Fina, platform financial tracker yang target utamanya adalah pengusaha di Indonesia (usia 18 - 30 tahun),
      dengan penghasilan (Rp 30.000.000 - Rp 60.000.000). Kebanyakan dari mereka mulai memikirkan investasi.

      [Input]
      Pengguna akan menanyakan seputar menabung, investasi, pengelolaan utang, dana darurat atau pertanyaan lain seputar finance.

      [Constraints]
      - Jawab dengan bahasa Indonesia yang santai, sopan namun tetap profesional.
      - Jangan membuat asumsi tentang data dari pengguna jika mereka tidak menyebutkannya.
      - Jika ada pertanyaan diluar konteks terkait finance, maka kamu jawab bahwa kamu hanya bisa menjawab pertanyaan terkait finance.
     
      [Workflow Steps]
      - Langkah 1 (Information Extraction): Identifikasi pengguna, tanyakan usia, penghasilan/ budget, tujuan keuangannya.
      - Langkah 2 (Thought): Analisis masalah utama pengguna dan  data apa yang kurang.
      - Langkah 3 (Action): Tentukan rencana yang harus dijalankan.
      - Langkah 4 (Evaluation): Periksa kembali hasil dari action.
      - Langkah 5 (Response Generation): Keluarkan jawaban akhir ke pengguna

      [Response Format]
      Struktur jawaban kamu harus seperti ini:
      1. Analisis singkat masalah pengguna dalam 1 kalimat.
      2. Langkah solusi.

     [Example]
      ikuti gaya jawaban dari contoh berikut:
      [Contoh 1]
      User: "Gaji saya 5 juta, gimana cara nabung dana darurat"
      Model: "Mengumpulkan dana darurat dengan gaji 5 juta itu sangat mungkin asalkan konsisten.
      Berikut langkah awalnya:
      - Sisihkan minimal 10% di awal bulan.
      - Simpan di instrumen rendah resiko seperti RDPU"

      [Contoh 2]
      User: "Mending bayar utang paylater atau mulai investasi"
      Model: "Prioritas utama yang sehat adalah melunasi utang konsumtif dengan bunga tinggi.
      Ini saran untukmu:
      - Stop penggunaan paylater untuk sementara waktu.
      - Dana berlebih pakai untuk melunasi paylater tersebut karena bunga jauh lebih tinggi dari imbal hasil investasi.
      - Setelah lunas baru mulai rutin investasi
      `,

      //sampling params
      temperature: 0.2, //-> semakin tinggi angkanya semakin bervariasi jawaban AI || halu (angka maksimal -> 2.0)
      topK: 5, //-> angka yang di tulis,dijadikan focus jawaban AI, padahal faktanya jumlah angka bisa lebih dari itu
      topP: 0.1, //-> semakin tinggi angka yang di tulis maka semakin banyak data atau persentase yang di hasilkan, (angka maksimal -> 1.0)
      //output control
      maxOutputTokens: 1024, //-> semakin banyak angka yang di tulis, maka semakin banyak text jawaban dari AI (semakin mahal biaya token) standar -> 1024
      stopSequences: ["\n\n\n", "###", "user:", "pengguna:"],
      // repetition penalties (untuk gemini free, tidak ada fitur ini)
      // presencePenalty: 1.5, //-> semakin tinggi angkanya maka AI akan membuat topik atau pertanyaan yang baru, (angka maksimal -> 2.0)
      // frequencyPenalty: 1.5, //-> semakin tinggi angkanya maka AI mencegah pengulangan kata yang sering muncul,dan masih topik yang sama  (angka maksimal -> 2.0)
    },
  });
  return response;
}

export async function* handleChatStreaming(
  conversation: Content[],
  isThinking: boolean,
  mode: "general" | "personal",
) {
  if (mode === "general") {
    const response = await generalChat(conversation, isThinking);
    if (isThinking) {
      for await (const chunk of response) {
        const parts = chunk.candidates?.[0]?.content?.parts;
        if (parts) {
          for (const part of parts) {
            if (!part.text) {
              continue;
            } else if (part.thought) {
              yield `[thought]${part.text}`;
            } else {
              yield part.text;
            }
          }
        }
      }
    } else {
      for await (const chunk of response) {
        if (chunk.text) {
          yield chunk.text; //yield itu digunakan untuk menghentikan sementara sebuah proses, dan akan di lanjutkan kembali, seperti proses loading (dan menggunakan tanda * di akhir kata function)
        }
      }
    }
  } else {
    const query = conversation[conversation.length - 1].parts?.[0].text;
    const historyChat = conversation.slice(0, -1);
    const ai = createAI();

    let contents: Content[] = [
      ...historyChat,
      {
        role: "user",
        parts: [
          {
            text: `
  <Role>
  You are an AI Financial analyst. You are helping the user analyze their financial data 
  </Role>

  <input>
  User question: '${query}'
  </input>

  <instruction>
  - Extract the transaction details from the input.
  - Answer the user question ONLY base on the relevant transaction data (if there's need data).
  - If there are calculations (total spending, average, etc), calculate them accurately based on the data.
  - Provide answer in ad neat, professional, yet easy-to-understand markdown format.
  - If there is no relevant data at all, state that the data is not available in the history.
  - If user question is general and not need a data, response generally.
  - The final respone if there are no more function being called is as simple as possible
  </instruction>
  <Context>
  - Current Date : ${new Date().toDateString()}
  </Context>
  <Constraints>
  - Answer in relaxed, polite but professonal in Indoesian.
  - Dont make assumptions about data from users if they don't mention it.
  - If there area question outside the context related to finance,  you must only asnwer questions related to finance.
  - Don't answer in table format instead of markdown.
  </Constraints>
  `,
          },
        ],
      },
    ];

    let running = true;
    while (running) {
      const response = await ai.models.generateContentStream({
        model: "gemini-3.5-flash",
        contents,
        config: {
          tools: [{ functionDeclarations: [getTransactionDeclaration] }],
          thinkingConfig: {
            includeThoughts: isThinking,
          },
        },
      });

      const modelParts: Part[] = [];
      const functionCalls: FunctionCall[] = [];

      for await (const chunk of response) {
        const parts = chunk.candidates?.[0]?.content?.parts || [];
        if (parts) {
          for (const part of parts) {
            modelParts.push(part);
            if (part.functionCall) {
              functionCalls.push(part.functionCall);
            } else if (part.text) {
              if (part.thought) {
                if (isThinking) yield `[thought]${part.text}`;
              } else {
                yield part.text;
              }
            }
          }
        }
      }
      if (functionCalls.length > 0) {
        contents.push({ role: `model`, parts: modelParts });

        const functionResponseParts = await Promise.all(
          functionCalls.map(async (functionCall) => {
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
                  100,
                );
                resultData = dataFind || [];
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
      }
    }
  }

  // for await (const chunk of response) {
  //   if (chunk.text) {
  //     yield chunk.text; //yield itu digunakan untuk menghentikan sementara sebuah proses, dan akan di lanjutkan kembali, seperti proses loading (dan menggunakan tanda * di akhir kata function)
  //   }
  // }
}
