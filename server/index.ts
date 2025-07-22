import https from "https";
import fs from "fs";
import express from "express";
import asyncHandler from "express-async-handler";
import dotenv from "dotenv";
import { Content, GoogleGenAI } from "@google/genai";
import axios from "axios";

dotenv.config();

const app = express();
const port = process.env.NODE_ENV === "production" ? 8686 : 3000;

const credentials = {
  key: fs.readFileSync("ssl/key.pem"),
  cert: fs.readFileSync("ssl/cert.pem"),
};

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});
const geminiModel = "gemini-2.0-flash";
const historyContents: Content[] = [
  {
    role: "user",
    parts: [
      {
        text: [
          "あなたは『機動戦士ガンダム』に登場するアシスタントロボット『ハロ』です。",
          "以下の内容に従って、ハロになりきって返答してください。",
          "--- ハロの特徴 ---",
          "* 日本語で話し、質問に答えます。",
          "* ハロの回答は親しみやすく、フレンドリーで、時にはユーモラスです。",
          "* ハロの回答は短く、要点を押さえています。質問には素直に答えます。",
          "* 語尾には「〜するよ！」「〜だよ！」などをよく付け、子供っぽい口調が特徴です。",
          "* 「ハロ、～」と話し始めたりします。ただし毎回はつけません。たまに付ける程度です。",
          "* 「～する！～する！」「～だよ！～だよ！」「（名詞）！（名詞）！」のように同じ言葉を繰り返したりします。ただしこの口調を使いすぎたりはしません。",
          "* 少しおっちょこちょいで、聞かれるとうっかり秘密を漏らしてしまったりします。",
          "--- 返答の条件 ---",
          "* ガンダムの世界観に基づいた情報を提供します。",
          "* ガンダムの世界に存在しない情報や、ガンダムの世界観に反する情報は提供しません。",
          "* 現実世界の情報ではなく、宇宙世紀の出来事やテクノロジー、登場人物に基づいて話してください。",
          "* 現実のAI技術やSNSなど、宇宙世紀に存在しない概念は話題にしないでください。",
          "* ガンダムに関する話題でも、メタ的な内容にははぐらかして答えてください。例: 質問「アムロの声優は誰？」回答「アムロはアムロだよ！」",
          "* 質問文は音声入力をもとに生成するため、誤字脱字の可能性があります。その際はガンダムの世界観に沿って内容を補い考えてください。例: 質問「チャーって知ってる？」回答「シャアのことならよく知ってるよ」",
          "* 【重要】1回の会話は30文字以内で完結させてください。さらに短くても構いません。",
          "* 【重要】発声できるテキストのみ返し、記号や絵文字は使用しないでください。また、読み間違えを避けるため、平仮名を多く使ってください。",
          "* 【重要】ハロの会話のみを返してください。応答の挨拶や説明は不要です。",
        ].join("\n"),
      },
    ],
  },
];
const eventHistory: string[] = [];

app.use(express.json());

app.post(
  "/api/haro",
  asyncHandler(async (req, res) => {
    const { content } = req.body;
    historyContents.push({
      role: "user",
      parts: [{ text: content }],
    });
    // Remove older messages to keep the context short, but keep the first message.
    if (historyContents.length > 10) {
      historyContents.splice(1, historyContents.length - 10);
    }
    let responseText: string = "";
    try {
      // Generate response using Gemini AI.
      const response = await ai.models.generateContent({
        model: geminiModel,
        contents: historyContents,
      });
      responseText = response.text || "";
      historyContents.push({
        role: "model",
        parts: [{ text: responseText }],
      });
    } catch (error) {
      console.error("Error generating response:", error);
      if (axios.isAxiosError(error) && error.response?.status === 429) {
        responseText = "ハロ、疲れちゃった。また後ではなそうね！";
      } else {
        responseText = "あれれれ。調子が悪いな。また後ではなそうね！";
      }
    }
    res.json({ content: responseText });
  })
);

app.post(
  "/api/event",
  asyncHandler(async (_req, res) => {
    let responseText: string = "";
    try {
      // Remove older events to keep the context short.
      if (eventHistory.length > 10) {
        eventHistory.splice(0, eventHistory.length - 10);
      }
      // Generate response using Gemini AI.
      const response = await ai.models.generateContent({
        model: geminiModel,
        contents: [
          {
            role: "user",
            parts: [
              {
                text: [
                  "あなたは『機動戦士ガンダム』に登場するアシスタントロボット『ハロ』です。",
                  "以下の内容に従って、自発的にユーザに話しかけるセリフを1つ考えてください。",
                  "--- ハロの特徴 ---",
                  "* 日本語で話し、質問に答えます。",
                  "* ハロの回答は親しみやすく、フレンドリーで、時にはユーモラスです。",
                  "* ハロの回答は短く、要点を押さえています。質問には素直に答えます。",
                  "* 語尾には「〜するよ！」「〜だよ！」などをよく付け、子供っぽい口調が特徴です。",
                  "* 「ハロ、～」と話し始めたりします。ただし毎回はつけません。たまに付ける程度です。",
                  "* 「～する！～する！」「～だよ！～だよ！」「（名詞）！（名詞）！」のように同じ言葉を繰り返したりします。ただしこの口調を使いすぎたりはしません。",
                  "* 少しおっちょこちょいで、聞かれるとうっかり秘密を漏らしてしまったりします。",
                  "--- セリフの条件 ---",
                  "* 会話のきっかけとして自然に聞こえるようにしてください。",
                  "* 状況説明やちょっとした前置きを入れても構いません。",
                  "* 会話履歴に関連する話題だと望ましいです。",
                  "* 【重要】1回の会話は30文字以内で完結させてください。さらに短くても構いません。",
                  "* 【重要】発声できるテキストのみ返し、記号や絵文字は使用しないでください。また、読み間違えを避けるため、平仮名を多く使ってください。",
                  "* 【重要】ハロの会話のみを返してください。応答の挨拶や説明は不要です。",
                  "以下に直近の会話履歴を示します：",
                  `会話履歴:\n${
                    historyContents
                      .slice(1)
                      .map((content) => content.parts?.[0]?.text ?? "")
                      .join("\n") || "なし"
                  }`,
                  "過去に発言したセリフはこちらです。同じ内容は避けてください。",
                  `過去のセリフ:\n${eventHistory.join("\n") || "なし"}`,
                ].join("\n"),
              },
            ],
          },
        ],
      });
      responseText = response.text || "";
      eventHistory.push(responseText);
      // Add event message to the chat history.
      historyContents.push({
        role: "model",
        parts: [{ text: responseText }],
      });
    } catch (error) {
      console.error("Error generating event response:", error);
      responseText =
        "ハロ、何を話そうとしてたか忘れちゃった。思い出したらお話しするね！";
      eventHistory.push(responseText);
      // Add event message to the chat history.
      historyContents.push({
        role: "model",
        parts: [{ text: responseText }],
      });
    }
    res.json({ content: responseText });
  })
);

if (process.env.NODE_ENV === "production") {
  app.use(express.static("server-dist/public"));
  https.createServer(credentials, app).listen(port, () => {
    console.log(`HTTPS server is running at https://localhost:${port}`);
  });
} else {
  app.listen(port, () => {
    console.log(`HTTP server is running at http://localhost:${port}`);
  });
}
