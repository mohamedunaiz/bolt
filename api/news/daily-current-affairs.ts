import { app } from "../../server.ts";

export default function handler(req: any, res: any) {
  req.url = "/api/news/daily-current-affairs";
  return app(req, res);
}
