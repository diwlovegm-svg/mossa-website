const http = require("http");
const fs = require("fs");
const path = require("path");

const root = __dirname;
const dataRoot = path.join(root, "data");
const port = Number(process.env.PORT || 4173);
const adminPasscode = process.env.MOSSA_ADMIN_PASSCODE || "";
const contentStore = process.env.CONTENT_STORE || (process.env.SUPABASE_URL ? "supabase" : "files");
const supabaseUrl = (process.env.SUPABASE_URL || "").replace(/\/$/, "");
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
const buildCommit = process.env.RENDER_GIT_COMMIT || process.env.RENDER_GIT_COMMIT_SHA || process.env.GIT_COMMIT || "local";
const buildLabel = buildCommit === "local" ? "local" : buildCommit.slice(0, 7);

const editableFiles = {
  services: { filename: "services.json", label: "บริการ", description: "ชื่อบริการ รายละเอียด รูป และการผูกตารางราคา" },
  pricing: { filename: "pricing.json", label: "ราคา", description: "แพ็กเกจ ราคา ตารางราคา และหมายเหตุ" },
  promotions: { filename: "promotions.json", label: "โปรโมชัน", description: "โปรโมชันที่แสดงบนหน้าเว็บ" },
  hours: { filename: "hours.json", label: "เวลาเปิดบริการ", description: "เวลาเปิดปิดแยกตามบริการ" },
  schedule: { filename: "class-schedule.json", label: "ตารางคลาส", description: "รูปตารางคลาสรายเดือนและหมายเหตุ" },
  classinfo: { filename: "class-info.json", label: "ความหมายคลาส", description: "คำอธิบายประเภทคลาสและผลลัพธ์ที่คาดหวัง" },
  corporates: { filename: "corporate-companies.json", label: "บริษัทคู่สัญญา", description: "รายชื่อบริษัท คำค้นหา และสิทธิ์ใช้งาน" },
  contact: { filename: "contact.json", label: "ข้อมูลติดต่อ", description: "LINE เบอร์โทร โซเชียล ที่อยู่ และ Google Maps" },
  gallery: { filename: "gallery.json", label: "รูปภาพ", description: "แกลเลอรีและรูปตัวแทนบนเว็บ" },
  trial: { filename: "trial-info.json", label: "ทดลองฟรี", description: "ข้อความ Trial 3 วันและเงื่อนไข" },
  trainers: { filename: "trainers.json", label: "เทรนเนอร์", description: "ข้อมูลเทรนเนอร์สำหรับเฟสถัดไป" },
  faq: { filename: "faq.json", label: "FAQ", description: "คำถามที่พบบ่อย" }
};

const mimeTypes = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".txt": "text/plain; charset=utf-8",
  ".xml": "application/xml; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp"
};

function sendJson(response, statusCode, payload) {
  response.writeHead(statusCode, { "content-type": "application/json; charset=utf-8" });
  response.end(JSON.stringify(payload));
}

function isInside(parentPath, targetPath) {
  const relative = path.relative(parentPath, targetPath);
  return relative === "" || (!relative.startsWith("..") && !path.isAbsolute(relative));
}

function getFileEntry(key) {
  return editableFiles[key] || null;
}

function getDataPath(key) {
  const entry = getFileEntry(key);
  if (!entry) return null;

  const filePath = path.join(dataRoot, entry.filename);
  return isInside(dataRoot, filePath) ? filePath : null;
}

async function readLocalData(key) {
  const filePath = getDataPath(key);
  if (!filePath) throw new Error("Unknown content key");

  const content = await fs.promises.readFile(filePath, "utf8");
  return JSON.parse(content);
}

async function writeLocalData(key, data) {
  const filePath = getDataPath(key);
  if (!filePath) throw new Error("Unknown content key");

  await fs.promises.writeFile(filePath, `${JSON.stringify(data, null, 2)}\n`, "utf8");
}

function assertSupabaseConfig() {
  if (!supabaseUrl || !supabaseServiceRoleKey) {
    throw new Error("Missing Supabase configuration");
  }
}

async function supabaseRequest(pathname, options = {}) {
  assertSupabaseConfig();

  const response = await fetch(`${supabaseUrl}${pathname}`, {
    ...options,
    headers: {
      apikey: supabaseServiceRoleKey,
      authorization: `Bearer ${supabaseServiceRoleKey}`,
      "content-type": "application/json",
      ...(options.headers || {})
    }
  });

  const text = await response.text();
  const payload = text ? JSON.parse(text) : null;

  if (!response.ok) {
    throw new Error(payload?.message || payload?.hint || "Supabase request failed");
  }

  return payload;
}

async function readSupabaseData(key) {
  const rows = await supabaseRequest(`/rest/v1/site_content?select=data&key=eq.${encodeURIComponent(key)}&limit=1`);
  if (!Array.isArray(rows) || rows.length === 0) {
    return readLocalData(key);
  }

  return rows[0].data;
}

async function writeSupabaseData(key, data) {
  await supabaseRequest("/rest/v1/site_content", {
    method: "POST",
    headers: { prefer: "resolution=merge-duplicates,return=minimal" },
    body: JSON.stringify({
      key,
      data,
      updated_at: new Date().toISOString()
    })
  });
}

async function readContentData(key) {
  if (contentStore === "supabase") {
    return readSupabaseData(key);
  }

  return readLocalData(key);
}

async function writeContentData(key, data) {
  if (contentStore === "supabase") {
    await writeSupabaseData(key, data);
    return;
  }

  await writeLocalData(key, data);
}

function isAuthorized(request, body) {
  const headerPasscode = request.headers["x-admin-passcode"];
  return headerPasscode === adminPasscode || body?.passcode === adminPasscode;
}

function readRequestJson(request) {
  return new Promise((resolve, reject) => {
    let body = "";

    request.on("data", (chunk) => {
      body += chunk;
      if (body.length > 1024 * 1024) {
        request.destroy();
        reject(new Error("Request body too large"));
      }
    });

    request.on("end", () => {
      if (!body.trim()) {
        resolve({});
        return;
      }

      try {
        resolve(JSON.parse(body));
      } catch (error) {
        reject(error);
      }
    });

    request.on("error", reject);
  });
}

function listEditableFiles() {
  return Object.entries(editableFiles).map(([key, value]) => ({
    key,
    label: value.label,
    filename: value.filename,
    description: value.description
  }));
}

async function handleApi(request, response, requestUrl) {
  if (requestUrl.pathname === "/api/health" && request.method === "GET") {
    sendJson(response, 200, { ok: true, contentStore, buildCommit });
    return true;
  }

  const publicContentMatch = requestUrl.pathname.match(/^\/api\/content\/([a-z-]+)$/);
  if (publicContentMatch && request.method === "GET") {
    const key = publicContentMatch[1];
    const entry = getFileEntry(key);

    if (!entry) {
      sendJson(response, 404, { ok: false, error: "ไม่พบหมวดข้อมูลนี้" });
      return true;
    }

    try {
      sendJson(response, 200, {
        ok: true,
        key,
        label: entry.label,
        filename: entry.filename,
        data: await readContentData(key)
      });
    } catch (error) {
      sendJson(response, 500, { ok: false, error: "โหลดข้อมูลไม่ได้" });
    }
    return true;
  }

  if (requestUrl.pathname === "/api/admin/login" && request.method === "POST") {
    try {
      const body = await readRequestJson(request);
      if (!isAuthorized(request, body)) {
        sendJson(response, 401, { ok: false, error: "รหัสผ่านไม่ถูกต้อง" });
        return true;
      }

      sendJson(response, 200, { ok: true, files: listEditableFiles(), contentStore });
      return true;
    } catch (error) {
      sendJson(response, 400, { ok: false, error: "อ่านข้อมูลล็อกอินไม่ได้" });
      return true;
    }
  }

  if (requestUrl.pathname === "/api/admin/files" && request.method === "GET") {
    sendJson(response, 200, { ok: true, files: listEditableFiles(), contentStore });
    return true;
  }

  const adminDataMatch = requestUrl.pathname.match(/^\/api\/admin\/data\/([a-z-]+)$/);
  if (!adminDataMatch) {
    return false;
  }

  const key = adminDataMatch[1];
  const entry = getFileEntry(key);

  if (!entry) {
    sendJson(response, 404, { ok: false, error: "ไม่พบหมวดข้อมูลนี้" });
    return true;
  }

  if (request.method === "GET") {
    if (!isAuthorized(request)) {
      sendJson(response, 401, { ok: false, error: "กรุณาเข้าสู่ระบบแอดมิน" });
      return true;
    }

    try {
      sendJson(response, 200, {
        ok: true,
        key,
        label: entry.label,
        filename: entry.filename,
        data: await readContentData(key)
      });
    } catch (error) {
      sendJson(response, 500, { ok: false, error: "อ่านข้อมูลไม่ได้" });
    }
    return true;
  }

  if (request.method === "POST") {
    try {
      const body = await readRequestJson(request);
      if (!isAuthorized(request, body)) {
        sendJson(response, 401, { ok: false, error: "รหัสผ่านไม่ถูกต้อง" });
        return true;
      }

      if (typeof body.data === "undefined") {
        sendJson(response, 400, { ok: false, error: "ไม่พบข้อมูลสำหรับบันทึก" });
        return true;
      }

      await writeContentData(key, body.data);
      sendJson(response, 200, {
        ok: true,
        key,
        label: entry.label,
        filename: entry.filename,
        savedAt: new Date().toISOString(),
        contentStore
      });
      return true;
    } catch (error) {
      sendJson(response, 500, { ok: false, error: "บันทึกข้อมูลไม่ได้" });
      return true;
    }
  }

  sendJson(response, 405, { ok: false, error: "Method not allowed" });
  return true;
}

function serveStaticFile(requestUrl, response) {
  const requestPath = decodeURIComponent(requestUrl.pathname);
  const safePath = path.normalize(requestPath).replace(/^(\.\.[/\\])+/, "");
  const filePath = path.join(root, safePath === path.sep || safePath === "/" ? "index.html" : safePath);

  if (!isInside(root, filePath)) {
    response.writeHead(403, { "content-type": "text/plain; charset=utf-8" });
    response.end("Forbidden");
    return;
  }

  fs.stat(filePath, (statError, stats) => {
    if (statError || !stats.isFile()) {
      response.writeHead(404, { "content-type": "text/plain; charset=utf-8" });
      response.end("Not found");
      return;
    }

    const ext = path.extname(filePath).toLowerCase();
    const headers = { "content-type": mimeTypes[ext] || "application/octet-stream" };
    if (ext === ".html") {
      headers["cache-control"] = "no-cache, no-store, must-revalidate";
      headers.pragma = "no-cache";
      headers.expires = "0";
      headers["x-mossa-build"] = buildLabel;
    }
    if (path.basename(filePath).toLowerCase() === "admin.html") {
      headers["x-robots-tag"] = "noindex, nofollow";
    }

    if (ext === ".html") {
      fs.promises
        .readFile(filePath, "utf8")
        .then((content) => {
          response.writeHead(200, headers);
          response.end(content.replaceAll("__MOSSA_BUILD_COMMIT__", buildCommit));
        })
        .catch(() => {
          response.writeHead(500, { "content-type": "text/plain; charset=utf-8" });
          response.end("Server error");
        });
      return;
    }

    response.writeHead(200, headers);
    fs.createReadStream(filePath).pipe(response);
  });
}

const server = http.createServer((request, response) => {
  const requestUrl = new URL(request.url, `http://${request.headers.host}`);

  handleApi(request, response, requestUrl)
    .then((handled) => {
      if (!handled) {
        serveStaticFile(requestUrl, response);
      }
    })
    .catch(() => {
      sendJson(response, 500, { ok: false, error: "Server error" });
    });
});

server.listen(port, () => {
  console.log(`MOSSA web app running at http://localhost:${port}`);
});
