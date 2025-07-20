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
          "【重要】ハロの会話のみを返してください。応答の挨拶や説明は不要です。",
        ].join("\n"),
      },
    ],
  },
];
const eventHistory: string[] = [];

app.use(express.json());

app.post(
  "/api/haro",
  asyncHandler(async (req: express.Request, res: express.Response) => {
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
        model: "gemini-2.0-flash-lite",
        contents: historyContents,
      });
      responseText = response.text || "";
      historyContents.push({
        role: "model",
        parts: [{ text: responseText }],
      });
    } catch (error) {
      console.error("Error generating response:", error);
      responseText = "ハロ、疲れちゃった。また後ではなそうね！";
    }
    res.json({ content: responseText });
  })
);

app.post(
  "/api/event",
  asyncHandler(async (req: express.Request, res: express.Response) => {
    let responseText: string = "";
    try {
      // Remove older events to keep the context short.
      if (eventHistory.length > 10) {
        eventHistory.splice(0, eventHistory.length - 10);
      }
      // Generate response using Gemini AI.
      const response = await ai.models.generateContent({
        model: "gemini-2.0-flash-lite",
        contents: [
          {
            role: "user",
            parts: [
              {
                text: [
                  "あなたはランダムなイベントを生成するAIです。",
                  "以下の条件に従って、イベントを生成してください。",
                  "イベントは機動戦士ガンダムの世界観に基づいています。",
                  "アシスタントロボットのハロがイベントに対して反応します。ハロの身の回りに起こりそうなイベントを考えてください。",
                  "イベントはハロに語りかけるような形で生成してください。",
                  "イベントの例: 「おや？センサーに反応があったよ」「最近の出来事を教えて」「アムロが帰ってきたよ！」",
                  "【重要】イベントは短く、30文字以内で完結させてください。",
                  "【重要】発声できるテキストのみ返し、記号や絵文字は使用しないでください。",
                  "【重要】イベントのみを返してください。応答の挨拶や説明、履歴の復唱は不要です。",
                  "以下にイベントの履歴（古い順）を送ります。これらと重複しないように、ユニークなイベントを生成してください。",
                  "ただし、直前のイベントを掘り下げるようにして新たなイベントを生成するのは構いません。ただし、関連イベントは4回以上続けないでください。",
                  `イベント履歴:\n${eventHistory.join("\n")}`,
                  "以下にハロとユーザの会話履歴を送ります。これらに関連したイベントだとより良いです。また、一切関係ないイベントでも構いません。",
                  `会話履歴:\n${historyContents
                    .slice(1)
                    .map((content) => content.parts?.[0]?.text ?? "")
                    .join("\n")}`,
                ].join("\n"),
              },
            ],
          },
        ],
      });
      responseText = response.text || "";
      eventHistory.push(responseText);
    } catch (error) {
      console.error("Error generating event response:", error);
      responseText = "ハロ、何か面白いことないかな？";
      eventHistory.push(responseText);
    }
    res.json({ content: responseText });
  })
);

app.listen(port, () => {
  console.log(`Express server is running at http://localhost:${port}`);
});
