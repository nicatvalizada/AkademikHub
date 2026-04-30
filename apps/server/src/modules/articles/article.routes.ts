import {
  articleCreateSchema,
  articleImportFromLinkSchema,
  articleUpdateSchema,
} from "@akademik/shared";
import { Router } from "express";
import multer from "multer";
import { requireAuth } from "../../middleware/auth.js";
import { requireRole } from "../../middleware/roles.js";
import { validateBody } from "../../middleware/validate.js";
import * as ctrl from "./article.controller.js";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 12 * 1024 * 1024 },
});

const r = Router();

r.use(requireAuth);

r.get("/published", ctrl.listPublished);
r.get("/mine", requireRole("teacher", "researcher", "student"), ctrl.listMine);
r.get("/trash", requireRole("teacher", "researcher", "student"), ctrl.listTrash);
r.post(
  "/import-from-link",
  requireRole("teacher", "researcher", "student"),
  validateBody(articleImportFromLinkSchema),
  ctrl.importFromLink,
);
r.post(
  "/import/file",
  requireRole("teacher", "researcher", "student"),
  upload.single("file"),
  ctrl.importFromFile,
);
r.get("/:id/export.pdf", ctrl.exportPdf);
r.get("/:id", ctrl.getById);
r.post("/", requireRole("teacher", "researcher", "student"), validateBody(articleCreateSchema), ctrl.create);
r.patch(
  "/:id",
  requireRole("teacher", "researcher", "student"),
  validateBody(articleUpdateSchema),
  ctrl.update,
);
r.delete("/:id", requireRole("teacher", "researcher", "student"), ctrl.remove);
r.post("/:id/restore", requireRole("teacher", "researcher", "student"), ctrl.restore);
r.delete(
  "/:id/permanent",
  requireRole("teacher", "researcher", "student"),
  ctrl.removePermanently,
);

export const articleRoutes = r;
