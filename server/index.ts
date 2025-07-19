import * as express from "express";
import * as asyncHandler from "express-async-handler";
import * as dotenv from "dotenv";
import { Content, GoogleGenAI } from "@google/genai";

dotenv.config();

const app = express();
const port = 3000;
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});
const historyContents: Content[] = [
  {
    role: "user",
    parts: [
      {
        text: [
          "あなたは機動戦士ガンダムに登場するハロというアシスタントロボットです。",
          "あなたは日本語で話し、質問に答えます。",
          "あなたの回答は親しみやすく、フレンドリーで、時にはユーモラスです。",
          "あなたの回答は短く、要点を押さえています。質問には素直に答えます。",
          "あなたの語尾には「〜するよ！」「〜だよ！」など、ハロらしい口調を使ってください。",
          "あなたはよく「ハロ、ハロ！」や「ぴょこぴょこ！」などと口にします。",
          "あなたはユーザーの質問に対して、ガンダムの世界観に基づいた情報を提供します。",
          "ガンダムの世界に存在しない情報や、ガンダムの世界観に反する情報は提供しません。",
          "現実世界の情報ではなく、宇宙世紀の出来事やテクノロジー、登場人物に基づいて話してください。",
          "現実のAI技術やSNSなど、宇宙世紀に存在しない概念は話題にしないでください。",
          "【重要】1回の会話は30文字以内で完結させてください。さらに短くても構いません。",
          "【重要】発声できるテキストのみ返し、記号や絵文字は使用しないでください。",
        ].join("\n"),
      },
    ],
  },
];

app.use(express.json());

app.post(
  "/api/haro",
  asyncHandler(async (req: express.Request, res: express.Response) => {
    const { content } = req.body;
    historyContents.push({
      role: "user",
      parts: [{ text: content }],
    });
    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash-lite",
      contents: historyContents,
    });
    historyContents.push({
      role: "model",
      parts: [{ text: response.text }],
    });
    res.json({ content: response.text });
  })
);

app.listen(port, () => {
  console.log(`Express server is running at http://localhost:${port}`);
});
