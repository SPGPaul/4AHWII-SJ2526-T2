import express from "express";
import multer from "multer";
import fetch from "node-fetch";
import rateLimit from "express-rate-limit";
import readline from "node:readline";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
});

const app = express();
app.use(express.json());

const limiter = rateLimit({ windowMs: 60_000, max: 30 });
app.use("/api/ai", limiter);

const FIXED_PROMPT =
  "Extrahiere den sichtbaren Text exakt 1:1 aus dem Bild. " +
  "Nicht umschreiben, nichts ergänzen, nur den Text ausgeben.";

function ensureImage(file) {
  if (!file) throw { status: 400, code: "no_file" };
  if (!file.mimetype || !file.mimetype.startsWith("image/")) {
    throw { status: 400, code: "not_image" };
  }
}

function makeModelPayloadFromImage(file, stream = false) {
  const b64 = file.buffer.toString("base64");

  return {
    model: "minicpm-v",
    prompt: FIXED_PROMPT,
    images: [b64],
    stream,
    options: {
      temperature: 0,
      num_predict: 2048,
    },
  };
}

// Nicht-Streaming
app.post("/api/ai-upload", upload.single("file"), async (req, res) => {
  try {
    const file = req.file;
    ensureImage(file);

    const body = makeModelPayloadFromImage(file, false);

    const resp = await fetch("http://localhost:11434/api/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (!resp.ok) {
      const text = await resp.text().catch(() => null);
      console.error("model error", resp.status, text);
      throw new Error(`model ${resp.status}`);
    }

    const json = await resp.json();
    console.log("OLLAMA JSON:", JSON.stringify(json, null, 2));

    const text =
      json?.response ??
      json?.message?.content ??
      json?.output ??
      json?.result ??
      "";

    return res.json({
      ok: true,
      model_text: text,
      raw: json,
    });
  } catch (e) {
    console.error("non-stream error:", e);
    const status = e?.status || 500;
    const code = e?.code || "model_error";
    return res.status(status).json({ error: code });
  }
});

// Streaming
app.post("/api/ai/stream-upload", upload.single("file"), async (req, res) => {
  let keepAlive;

  try {
    const file = req.file;
    ensureImage(file);

    res.setHeader("Content-Type", "text/event-stream; charset=utf-8");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.flushHeaders?.();

    keepAlive = setInterval(() => {
      try {
        res.write(":\n\n");
      } catch {}
    }, 15000);

    const body = makeModelPayloadFromImage(file, true);

    const resp = await fetch("http://localhost:11434/api/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (!resp.ok) {
      const text = await resp.text().catch(() => null);
      console.error("model error", resp.status, text);
      res.write(`event: error\ndata: ${JSON.stringify("model_error")}\n\n`);
      clearInterval(keepAlive);
      return res.end();
    }

    const rl = readline.createInterface({
      input: resp.body,
      crlfDelay: Infinity,
    });

    for await (const line of rl) {
      const t = String(line).trim();
      if (!t) continue;

      try {
        const obj = JSON.parse(t);

        const piece = String(
          obj?.response ??
            obj?.message?.content ??
            obj?.delta ??
            obj?.thinking ??
            "",
        );

        if (piece) {
          res.write(`data: ${JSON.stringify(piece)}\n\n`);
        }

        if (obj?.done) {
          res.write("event: done\ndata: {}\n\n");
          clearInterval(keepAlive);
          return res.end();
        }
      } catch (parseErr) {
        console.error("stream parse error:", parseErr, "line:", t);
      }
    }

    res.write("event: done\ndata: {}\n\n");
    clearInterval(keepAlive);
    return res.end();
  } catch (e) {
    console.error("stream endpoint error:", e);
    try {
      res.write(`event: error\ndata: ${JSON.stringify("model_error")}\n\n`);
    } catch {}
    if (keepAlive) clearInterval(keepAlive);
    return res.end();
  }
});

app.use(express.static("public"));
app.listen(3000, () => console.log("listening on :3000"));
