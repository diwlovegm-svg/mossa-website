const fs = require("fs");
const path = require("path");

const supabaseUrl = (process.env.SUPABASE_URL || "").replace(/\/$/, "");
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

const files = {
  services: "services.json",
  pricing: "pricing.json",
  promotions: "promotions.json",
  hours: "hours.json",
  schedule: "class-schedule.json",
  classinfo: "class-info.json",
  corporates: "corporate-companies.json",
  contact: "contact.json",
  gallery: "gallery.json",
  trial: "trial-info.json",
  trainers: "trainers.json",
  faq: "faq.json"
};

if (!supabaseUrl || !serviceRoleKey) {
  console.error("Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY before seeding.");
  process.exit(1);
}

async function upsertContent(key, data) {
  const response = await fetch(`${supabaseUrl}/rest/v1/site_content`, {
    method: "POST",
    headers: {
      apikey: serviceRoleKey,
      authorization: `Bearer ${serviceRoleKey}`,
      "content-type": "application/json",
      prefer: "resolution=merge-duplicates,return=minimal"
    },
    body: JSON.stringify({
      key,
      data,
      updated_at: new Date().toISOString()
    })
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`${key}: ${response.status} ${text}`);
  }
}

async function main() {
  const dataRoot = path.join(__dirname, "..", "data");

  for (const [key, filename] of Object.entries(files)) {
    const data = JSON.parse(fs.readFileSync(path.join(dataRoot, filename), "utf8"));
    await upsertContent(key, data);
    console.log(`seeded ${key}`);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
