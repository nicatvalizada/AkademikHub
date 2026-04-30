import { Router } from "express";
import multer from "multer";
import { requireAuth } from "../../middleware/auth.js";
import { aiRateLimit } from "../../middleware/rateLimit.js";
import { requireRole } from "../../middleware/roles.js";
import { validateBody } from "../../middleware/validate.js";
import * as ctrl from "./test.controller.js";
import { testAiGenerateSchema, testCreateSchema, testSubmitSchema, testUpdateSchema } from "@akademik/shared";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 8 * 1024 * 1024 },
});

const r = Router();

r.use(requireAuth);

r.get("/", ctrl.list);
r.post(
  "/import/json",
  requireRole("teacher", "researcher", "student"),
  upload.single("file"),
  ctrl.importJson,
);
r.post(
  "/import/pdf",
  requireRole("teacher", "researcher", "student"),
  upload.single("file"),
  ctrl.importPdf,
);
r.post(
  "/import/docx",
  requireRole("teacher", "researcher", "student"),
  upload.single("file"),
  ctrl.importDocx,
);
r.post(
  "/ai/generate",
  requireRole("teacher", "researcher", "student"),
  aiRateLimit,
  validateBody(testAiGenerateSchema),
  ctrl.aiGenerate,
);
r.get("/:id/export.json", ctrl.exportJson);
r.get("/:id/export.pdf", ctrl.exportPdf);
r.get("/:id/stats", ctrl.stats);
r.get("/:id", ctrl.getById);
r.post("/", requireRole("teacher", "researcher", "student"), validateBody(testCreateSchema), ctrl.create);
r.patch(
  "/:id",
  requireRole("teacher", "researcher", "student"),
  validateBody(testUpdateSchema),
  ctrl.update,
);
r.delete("/:id", requireRole("teacher", "researcher", "student"), ctrl.remove);
r.post("/:id/submit", validateBody(testSubmitSchema), ctrl.submit);

export const testRoutes = r;
