import { app } from "../../server.ts";

export default function handler(req: any, res: any) {
  req.url = "/api/news/daily-current-affairs/sync";
  return app(req, res);
}
