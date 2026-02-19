import { Router } from "express";
import { openApiSpec, openApiYaml } from "./spec";

export function openApiRouter(): Router {
  const router = Router();

  router.get("/openapi.json", (_req, res) => {
    res.json(openApiSpec);
  });

  router.get("/openapi.yaml", (_req, res) => {
    res.type("text/yaml").send(openApiYaml);
  });

  return router;
}
