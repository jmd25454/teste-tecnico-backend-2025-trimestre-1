import { Router, Request, Response } from "express";
import Busboy from "busboy";
import path from "path";
import mime from "mime";
import { getVideo, videoExists, saveVideo } from "../services/videoService";

const router = Router();

router.post("/upload/video", (req, res) => {
  const busboy = Busboy({
    headers: req.headers,
    limits: { fileSize: 10 * 1024 * 1024 },
  });

  let fileReceived = false;
  let wasTooLarge = false;
  const promises: Promise<void>[] = [];

  busboy.on("file", (fieldname, file, info) => {
    const { filename } = info;
    const ext = path.extname(filename).toLowerCase();
    const allowedExtensions = [".mp4", ".webm", ".mov", ".avi"];

    if (!allowedExtensions.includes(ext)) {
      file.resume();
      res.status(400).send("Extensão de arquivo inválida");
      return;
    }

    fileReceived = true;
    const chunks: Buffer[] = [];

    file.on("data", (chunk) => chunks.push(chunk));

    file.on("limit", () => {
      file.resume();
      wasTooLarge = true;
      res.status(400).send("Arquivo excede o limite de 10MB");
      return;
    });

    const savePromise = new Promise<void>((resolve, reject) => {
      file.on("end", async () => {
        if (wasTooLarge) return resolve();

        try {
          const buffer = Buffer.concat(chunks);
          await saveVideo(filename, buffer);
          resolve();
        } catch (err) {
          reject(err);
        }
      });
    });

    promises.push(savePromise);
  });

  busboy.on("finish", async () => {
    if (wasTooLarge) {
      return res.status(400).send("Arquivo excede o limite de 10MB");
    }

    if (!fileReceived) {
      return res.status(400).send("Nenhum arquivo enviado");
    }

    try {
      await Promise.all(promises);
      res.status(204).end();
    } catch (err) {
      console.error("Erro ao salvar arquivo:", err);
      res.status(500).send("Erro interno ao salvar");
    }
  });

  req.pipe(busboy);
});

router.get("/static/video/:filename", async (req: Request, res: Response) => {
  const { filename } = req.params;

  const exists = await videoExists(filename);
  if (!exists) {
    res.status(404).send("Arquivo não encontrado");
    return;
  }

  const videoBuffer = await getVideo(filename);
  if (!videoBuffer) {
    res.status(500).send("Erro ao carregar vídeo");
    return;
  }

  const range = req.headers.range;
  const total = videoBuffer.length;
  const mimeType = mime.getType(path.extname(filename)) || "video/mp4";

  res.setHeader("Content-Type", mimeType);
  res.setHeader("Accept-Ranges", "bytes");

  if (range) {
    const [startStr, endStr] = range.replace(/bytes=/, "").split("-");
    const start = parseInt(startStr, 10);
    const end = endStr ? parseInt(endStr, 10) : total - 1;

    if (isNaN(start) || isNaN(end) || start > end || end >= total) {
      res.status(416).send("Range inválido");
      return;
    }

    const chunk = videoBuffer.slice(start, end + 1);
    res.status(206).set({
      "Content-Range": `bytes ${start}-${end}/${total}`,
      "Content-Length": `${chunk.length}`,
    });
    res.end(chunk);
    return;
  }

  res.status(200).set("Content-Length", `${total}`);
  res.end(videoBuffer);
});

export default router;
