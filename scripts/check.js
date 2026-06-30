const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..");
const jsFiles = ["app.js", "admin.js", "server.js"];
const dataRoot = path.join(root, "data");

for (const file of jsFiles) {
  const content = fs.readFileSync(path.join(root, file), "utf8");
  new Function("require", "module", "exports", content);
}

for (const file of fs.readdirSync(dataRoot).filter((name) => name.endsWith(".json"))) {
  JSON.parse(fs.readFileSync(path.join(dataRoot, file), "utf8"));
}

console.log("MOSSA check passed");
