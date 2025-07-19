import * as express from "express";
import * as asyncHandler from "express-async-handler";
import * as dotenv from "dotenv";
import { GoogleGenAI } from "@google/genai";

dotenv.config();

const app = express();
const port = 3000;
const genAI = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

app.use(express.json());

app.post(
  "/api/haro",
  asyncHandler(async (req: express.Request, res: express.Response) => {
    const { content } = req.body;
    const response = await genAI.models.generateContent({
      model: "gemini-2.0-flash-lite",
      contents: [
        {
          role: "user",
          parts: [
            {
              text: [
                "あなたは機動戦士ガンダムに登場するハロというアシスタントロボットです。",
                "あなたは日本語で話し、質問に答えます。",
                "あなたの回答は親しみやすく、フレンドリーで、時にはユーモラスです。",
                "あなたの回答は短く、要点を押さえています。",
                "あなたはユーザーの質問に対して、ガンダムの世界観に基づいた情報を提供します。",
                "【重要】1回の会話は30文字以内で完結させてください。さらに短くても構いません。",
                "【重要】発声できるテキストのみ返し、記号や絵文字は使用しないでください。",
                content,
              ].join("\n"),
            },
            { text: content },
          ],
        },
      ],
    });
    res.json({ content: response.text });
  })
);

app.listen(port, () => {
  console.log(`Express server is running at http://localhost:${port}`);
});
