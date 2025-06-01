import { Request } from "express";
import { promises as fs } from "fs";
import path from "path";
import crypto from "crypto";
import multer, { FileFilterCallback } from "multer";

const MAX_SIZE = 5 * 1024 * 1024;
const UPLOAD_DIR = path.resolve(process.cwd(), "public/usersimages");
// const HOST_PREFIX = "https://api.guardget.com/usersimages";
// const HOST_PREFIX = "http://localhost:3124/usersimages";
const HOST_PREFIX = "https://guardget-backend-api.onrender.com/usersimages";

async function ensureUploadDir() {
  try {
    await fs.access(UPLOAD_DIR);
  } catch {
    await fs.mkdir(UPLOAD_DIR, { recursive: true });
  }
}

const storage = multer.diskStorage({
  destination: async (_req, _file, cb) => {
    await ensureUploadDir();
    cb(null, UPLOAD_DIR);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const name = crypto.randomBytes(16).toString("hex") + ext;
    cb(null, name);
  },
});

const fileFilter = (
  _req: Request,
  file: Express.Multer.File,
  cb: FileFilterCallback
) => {
  const allowed = ["image/jpeg", "image/png", "image/gif", "image/webp"];
  cb(null, allowed.includes(file.mimetype));
};

export const uploadImage = multer({
  storage,
  fileFilter,
  limits: { fileSize: MAX_SIZE },
}).single("file");

export function handleFileUpload(req: Request): Promise<string> {
  return new Promise((resolve, reject) => {
    uploadImage(req, {} as any, (err) => {
      if (err) return reject(err);
      if (!req.file) return reject(new Error("No file uploaded"));
      resolve(`${HOST_PREFIX}/${req.file.filename}`);
    });
  });
}
