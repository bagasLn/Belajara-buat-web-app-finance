"use server";

import { Conversation } from "@/app/types/ai";
import { createAI } from "./instance";
import z from "zod";
import { createClient } from "@/lib/supabase/server";
import { findEmbedding, generateEmbedding } from "./embedding";
import { Transaction } from "@/app/types/transaction";

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

async function generalChat(conversation: Conversation[], isThinking?: boolean) {
  const ai = createAI();
  const response = await ai.models.generateContentStream({
    model: "gemini-3.5-flash",
    contents: [...conversation],
    config: {
      thinkingConfig: {
        includeThoughts: isThinking,
        // thinkingLevel: isThinking ? ThinkingLevel.HIGH : ThinkingLevel.MINIMAL,
        // thinkingBudget: isThinking ? -1 : 0,
      },

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

async function personalizeChat(
  query: string,
  historyChat?: Conversation[],
  isThinking?: boolean,
) {
  const ai = createAI();

  const data = await findEmbedding(query);

  let contextData = "";

  if (!data || data.length === 0) {
    contextData =
      "No transaction found that area similar or relevant to the question";
  } else {
    contextData = data
      .map((transaction: Transaction) => {
        return JSON.stringify(transaction);
      })
      .join("\n");
  }
  const prompt = `
  <Role>
  You are an AI Financial analyst. You are helping the user analyze
  their financial data using the RAG (Retrieval-Augmented Generation) technique.
  </Role>
  
  <input>
  User question: '${query}'
  </input>

  <context>
  Relevant Transaction data from the database (order from most relevant)
  ${contextData}
  </context>

  <instruction>
  -Answer the user question ONLY base on the relevant transaction data above.
  -If there are calculations (total spending, average, etc), calculate them accurately based on the data.
  -Provide answer in ad neat, professional, yet easy-to-understand markdown format.
  -If there is no relevant data at all, state that the data is not available in the history.
  - If user question is general and not need a data, response generally.
  </instruction>

  <Constraints>
  - Don't asnwer in table format instaed of markdown
  </Constraints>
  
  `;

  const response = await ai.models.generateContentStream({
    model: "gemini-3.5-flash",
    contents: [
      ...(historyChat ?? []),
      { role: "user", parts: [{ text: prompt }] },
    ],
    config: {
      thinkingConfig: {
        includeThoughts: isThinking,
      },
    },
  });
  return response;
}

export async function* handleChatStreaming(
  conversation: Conversation[],
  isThinking: boolean,
  mode: "general" | "personal",
) {
  let response;
  if (mode === "general") {
    response = await generalChat(conversation, isThinking);
  } else {
    response = await personalizeChat(
      conversation[conversation.length - 1].parts[0].text,
      conversation.slice(0, -1),
      isThinking,
    );
  }

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

  for await (const chunk of response) {
    if (chunk.text) {
      yield chunk.text; //yield itu digunakan untuk menghentikan sementara sebuah proses, dan akan di lanjutkan kembali, seperti proses loading (dan menggunakan tanda * di akhir kata function)
    }
  }
}
