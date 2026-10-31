"use server";

import { Conversation } from "@/app/types/ai";
import { ENVIRONMENT } from "@/config/environment";
import { GoogleGenAI, ThinkingLevel } from "@google/genai";
import { freemem } from "os";

const ai = new GoogleGenAI({ apiKey: ENVIRONMENT.googleGenAIKey });

export async function handleChat(
  conversation: Conversation[],
  isThinking: boolean,
) {
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
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

export async function* handleChatStreaming(
  conversation: Conversation[],
  isThinking: boolean,
) {
  const response = await ai.models.generateContentStream({
    model: "gemini-3-flash-preview",
    contents: [...conversation],
    config: {
      thinkingConfig: {
        includeThoughts: isThinking,
        // thinkingLevel: isThinking ? ThinkingLevel.HIGH : ThinkingLevel.MINIMAL,
        // thinkingBudget: isThinking ? -1 : 0,
      },

      // mengatur bot atau ai, merespon, (menjadi spesifik)
      systemInstruction:
        "Kamu adalah seorang financial advisor yang akan menjawab pertanyaan user",
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

// export async function handleChatWithThinking(message: string) {
//   const response = await ai.models.generateContent({
//     model: "gemini-3-flash-preview",
//     contents: message,
//     config: {
//       thinkingConfig: {
//         includeThoughts: true,
//         // ini kalo misal mau di atur di di high. low atau minimal
//         // thinkingBudget: 0,
//         // thinkingLevel: ThinkingLevel.MINIMAL,
//       },
//     },
//   });
