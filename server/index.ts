import * as express from "express";
import * as asyncHandler from "express-async-handler";

const app = express();
const port = 3000;

app.use(express.json());

app.post(
  "/api/haro",
  asyncHandler(async (req: express.Request, res: express.Response) => {
    const { content } = req.body;
    setTimeout(() => {
      res.json({ content: `ハロ、${content}！` });
    });
  })
);

app.listen(port, () => {
  console.log(`Express server is running at http://localhost:${port}`);
});
