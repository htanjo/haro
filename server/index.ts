import * as express from "express";

const app = express();
const port = 3000;

app.use(express.json());

app.get("/api/haro", (req, res) => {
  res.json({ message: "Hello from Haro API!" });
});

app.listen(port, () => {
  console.log(`Express server is running at http://localhost:${port}`);
});
