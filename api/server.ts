import express, { Request, Response } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import app from "../server";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// In Vercel, static files are served by default from dist/
// This handler processes API routes that come through the /api rewrite
// For non-API requests on Vercel, the static files and SPA fallback are handled via vercel.json

// Ensure the Express app middleware is set up for API routes
const apiHandler = (req: Request, res: Response) => {
  // Call the Express app with this request/response
  app(req, res);
};

export default app;
