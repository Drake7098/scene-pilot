import fs from "node:fs";
import http from "node:http";
import path from "node:path";

const root = path.resolve("tests/robots");
const port = Number(process.env.ROBOT_DASHBOARD_PORT || 4188);

const mime = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".txt": "text/plain; charset=utf-8",
};

const server = http.createServer((req, res) => {
  const urlPath = req.url?.split("?")[0] || "/";
  const target =
    urlPath === "/"
      ? path.join(root, "dashboard", "index.html")
      : path.join(root, urlPath.replace(/^\//, ""));

  if (!target.startsWith(root)) {
    res.writeHead(403);
    res.end("forbidden");
    return;
  }

  if (!fs.existsSync(target) || fs.statSync(target).isDirectory()) {
    res.writeHead(404);
    res.end("not found");
    return;
  }

  const ext = path.extname(target);
  res.writeHead(200, {
    "Content-Type": mime[ext] || "application/octet-stream",
    "Cache-Control": "no-store",
  });
  fs.createReadStream(target).pipe(res);
});

server.listen(port, () => {
  console.log(`Robot dashboard: http://127.0.0.1:${port}`);
});
