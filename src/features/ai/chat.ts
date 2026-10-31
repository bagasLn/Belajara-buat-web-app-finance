"use server";

import { ENVIRONMENT } from "@/config/environment";
import { GoogleGenAI, ThinkingLevel } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: ENVIRONMENT.googleGenAIKey });

export async function handleChat(message: string, isThinking: boolean) {
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: message,
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
  message: string,
  isThinking: boolean,
) {
  const response = await ai.models.generateContentStream({
    model: "gemini-3-flash-preview",
    contents: message,
    config: {
      thinkingConfig: {
        includeThoughts: isThinking,
        // thinkingLevel: isThinking ? ThinkingLevel.HIGH : ThinkingLevel.MINIMAL,
        // thinkingBudget: isThinking ? -1 : 0,
      },
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
