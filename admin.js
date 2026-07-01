const adminState = {
  passcode: "",
  files: [],
  currentKey: "",
  currentMeta: null,
  currentData: null,
  serviceIndex: 0,
  priceIndex: 0,
  corporateIndex: 0,
  galleryIndex: 0,
  trialIndex: 0,
  faqIndex: 0,
  hourIndex: 0,
  trainerIndex: 0
};

const qs = (selector, root = document) => root.querySelector(selector);

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function ensureArray(value) {
  return Array.isArray(value) ? value : [];
}

function toLines(value) {
  return ensureArray(value).join("\n");
}

function fromLines(value) {
  return String(value || "")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
}

function toCommaList(value) {
  return ensureArray(value).join(", ");
}

function fromCommaList(value) {
  return String(value || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function newId(prefix = "item") {
  if (window.crypto?.randomUUID) {
    return `${prefix}-${window.crypto.randomUUID().slice(0, 8)}`;
  }

  return `${prefix}-${Date.now().toString(36)}`;
}

function setMessage(element, message, type = "") {
  if (!element) return;
  element.textContent = message || "";
  element.className = `admin-message${type ? ` is-${type}` : ""}`;
}

function setStatus(message, type = "") {
  setMessage(qs("#admin-status"), message, type);
}

async function apiJson(url, options = {}) {
  const headers = {
    "content-type": "application/json",
    ...(options.headers || {})
  };

  if (adminState.passcode) {
    headers["x-admin-passcode"] = adminState.passcode;
  }

  const response = await fetch(url, { ...options, headers });
  const payload = await response.json().catch(() => ({}));

  if (!response.ok || payload.ok === false) {
    throw new Error(payload.error || "เกิดข้อผิดพลาด");
  }

  return payload;
}

function showDashboard() {
  qs("#admin-login")?.classList.add("is-hidden");
  qs("#admin-dashboard")?.classList.remove("is-hidden");
}

function showLogin() {
  qs("#admin-login")?.classList.remove("is-hidden");
  qs("#admin-dashboard")?.classList.add("is-hidden");
}

async function login(passcode) {
  const loginMessage = qs("#login-message");
  setMessage(loginMessage, "กำลังตรวจสอบรหัสผ่าน...", "warn");

  adminState.passcode = passcode;

  try {
    const payload = await apiJson("/api/admin/login", {
      method: "POST",
      body: JSON.stringify({ passcode })
    });

    adminState.files = payload.files || [];
    sessionStorage.setItem("mossaAdminPasscode", passcode);
    renderFileList();
    showDashboard();
    setMessage(loginMessage, "");
    setStatus("เข้าสู่ระบบแล้ว เลือกหมวดข้อมูลที่ต้องการแก้ไข", "success");

    if (!adminState.currentKey && adminState.files.length) {
      await selectFile(adminState.files[0].key);
    }
  } catch (error) {
    sessionStorage.removeItem("mossaAdminPasscode");
    adminState.passcode = "";
    setMessage(loginMessage, error.message, "error");
    showLogin();
  }
}

function renderFileList() {
  const list = qs("#admin-file-list");
  if (!list) return;

  list.innerHTML = adminState.files.map((file) => `
    <button class="admin-file-button${file.key === adminState.currentKey ? " is-active" : ""}" type="button" data-file-key="${escapeHtml(file.key)}">
      <strong>${escapeHtml(file.label)}</strong>
      <span>${escapeHtml(file.description)}</span>
      <code>${escapeHtml(file.filename)}</code>
    </button>
  `).join("");

  list.querySelectorAll("[data-file-key]").forEach((button) => {
    button.addEventListener("click", () => selectFile(button.dataset.fileKey));
  });
}

async function selectFile(key) {
  const meta = adminState.files.find((file) => file.key === key);
  if (!meta) return;

  adminState.currentKey = key;
  adminState.currentMeta = meta;
  renderFileList();
  setEditorState(true);
  setStatus(`กำลังโหลด ${meta.label}...`, "warn");

  try {
    const payload = await apiJson(`/api/admin/data/${encodeURIComponent(key)}`);
    adminState.currentData = clone(payload.data);
    resetIndexes();
    renderEditor();
    setStatus(`โหลด ${meta.label} แล้ว`, "success");
  } catch (error) {
    setStatus(error.message, "error");
  } finally {
    setEditorState(false);
  }
}

function resetIndexes() {
  adminState.serviceIndex = 0;
  adminState.priceIndex = 0;
  adminState.corporateIndex = 0;
  adminState.galleryIndex = 0;
  adminState.trialIndex = 0;
  adminState.faqIndex = 0;
  adminState.hourIndex = 0;
  adminState.trainerIndex = 0;
}

function setEditorState(loading) {
  const hasKey = Boolean(adminState.currentKey);
  qs("#reload-data").disabled = loading || !hasKey;
  qs("#save-data").disabled = loading || !hasKey;
}

function renderEditor() {
  const meta = adminState.currentMeta;
  const body = qs("#admin-editor-body");
  if (!meta || !body) return;

  qs("#editor-filename").textContent = meta.filename;
  qs("#editor-title").textContent = meta.label;
  qs("#editor-description").textContent = meta.description;

  body.innerHTML = `${renderStructuredEditor(adminState.currentKey)}${renderJsonPanel()}`;
  attachStructuredHandlers(adminState.currentKey);
  attachJsonHandlers();
  updateRawFromState();
}

function renderStructuredEditor(key) {
  switch (key) {
    case "promotions":
      return renderPromotionsEditor();
    case "pricing":
      return renderPricingEditor();
    case "services":
      return renderServicesEditor();
    case "schedule":
      return renderScheduleEditor();
    case "contact":
      return renderContactEditor();
    case "corporates":
      return renderCorporateEditor();
    case "gallery":
      return renderGalleryEditor();
    case "trial":
      return renderTrialEditor();
    case "faq":
      return renderFaqEditor();
    case "hours":
      return renderHoursEditor();
    case "trainers":
      return renderTrainersEditor();
    default:
      return `<div class="admin-form-section"><p class="lead-text">หมวดนี้แก้ผ่าน JSON โดยตรง</p></div>`;
  }
}

function renderTextField({ label, value, selector, type = "text", placeholder = "" }) {
  return `
    <label class="admin-field">
      <span>${escapeHtml(label)}</span>
      <input type="${escapeHtml(type)}" value="${escapeHtml(value)}" placeholder="${escapeHtml(placeholder)}" ${selector}>
    </label>
  `;
}

function renderTextArea({ label, value, selector, placeholder = "", rows = 4 }) {
  return `
    <label class="admin-field admin-field-wide">
      <span>${escapeHtml(label)}</span>
      <textarea rows="${rows}" placeholder="${escapeHtml(placeholder)}" ${selector}>${escapeHtml(value)}</textarea>
    </label>
  `;
}

function renderSelect({ label, value, selector, options }) {
  return `
    <label class="admin-field">
      <span>${escapeHtml(label)}</span>
      <select ${selector}>
        ${options.map((option) => `
          <option value="${escapeHtml(option.value)}"${String(option.value) === String(value) ? " selected" : ""}>${escapeHtml(option.label)}</option>
        `).join("")}
      </select>
    </label>
  `;
}

function renderPromotionsEditor() {
  const promotions = ensureArray(adminState.currentData);

  return `
    <div class="admin-form-section">
      <div class="admin-section-title">
        <div>
          <h3>โปรโมชันหน้าเว็บ</h3>
          <p>แก้หัวข้อ คำอธิบาย และป้ายสถานะที่แสดงในหน้าโปรโมชัน</p>
        </div>
        <button class="btn btn-secondary" type="button" data-action="add-promotion">เพิ่มโปรโมชัน</button>
      </div>
      <div class="admin-repeat-list">
        ${promotions.map((promotion, index) => `
          <article class="admin-repeat-item">
            <div class="admin-repeat-head">
              <strong>${escapeHtml(promotion.titleTh || `โปรโมชัน ${index + 1}`)}</strong>
              <button class="btn btn-ghost" type="button" data-action="remove-promotion" data-index="${index}">ลบ</button>
            </div>
            <div class="admin-form-grid">
              ${renderTextField({ label: "ป้ายหมวด", value: promotion.label, selector: `data-promotion-index="${index}" data-prop="label"` })}
              ${renderTextField({ label: "ป้ายสถานะ", value: promotion.statusText, selector: `data-promotion-index="${index}" data-prop="statusText"` })}
              ${renderTextField({ label: "สถานะระบบ active/hidden", value: promotion.status || "active", selector: `data-promotion-index="${index}" data-prop="status"` })}
              ${renderTextField({ label: "วันหมดอายุ YYYY-MM-DD", value: promotion.expiresAt || "", selector: `data-promotion-index="${index}" data-prop="expiresAt"` })}
              ${renderTextField({ label: "หัวข้อ", value: promotion.titleTh, selector: `data-promotion-index="${index}" data-prop="titleTh"` })}
              ${renderTextField({ label: "ข้อความวันหมดอายุ", value: promotion.expiresLabel || "", selector: `data-promotion-index="${index}" data-prop="expiresLabel"` })}
              ${renderTextArea({ label: "รายละเอียด", value: promotion.descriptionTh, selector: `data-promotion-index="${index}" data-prop="descriptionTh"`, rows: 3 })}
            </div>
          </article>
        `).join("") || `<div class="empty-state">ยังไม่มีโปรโมชัน</div>`}
      </div>
    </div>
  `;
}

function renderPricingEditor() {
  const data = adminState.currentData || { categories: [], items: [] };
  data.categories = ensureArray(data.categories);
  data.items = ensureArray(data.items);
  adminState.currentData = data;

  if (!data.items.length) {
    data.items.push(createPriceItem());
  }

  if (adminState.priceIndex >= data.items.length) {
    adminState.priceIndex = 0;
  }

  const item = data.items[adminState.priceIndex];
  const options = data.items.map((priceItem, index) => ({
    value: index,
    label: `${index + 1}. ${priceItem.nameTh || priceItem.id || "รายการราคา"}`
  }));

  return `
    <div class="admin-form-section">
      <div class="admin-section-title">
        <div>
          <h3>ราคาและแพ็กเกจ</h3>
          <p>เลือกรายการราคา แก้คอลัมน์และแถวราคาได้ทันที แต่ละแถวใช้ Tab คั่นช่องข้อมูล</p>
        </div>
        <button class="btn btn-secondary" type="button" data-action="add-price-item">เพิ่มรายการราคา</button>
      </div>

      ${renderSelect({ label: "เลือกรายการราคา", value: adminState.priceIndex, selector: `id="price-item-select"`, options })}

      <div class="admin-form-grid">
        ${renderTextField({ label: "ID ราคา", value: item.id, selector: `data-price-prop="id"` })}
        ${renderTextField({ label: "หมวดราคา", value: item.categoryId, selector: `data-price-prop="categoryId"` })}
        ${renderTextField({ label: "ชื่อบนเว็บ", value: item.nameTh, selector: `data-price-prop="nameTh"` })}
        ${renderTextField({ label: "กลุ่ม/ป้าย", value: item.groupLabel, selector: `data-price-prop="groupLabel"` })}
        ${renderTextArea({ label: "คอลัมน์ตาราง", value: toLines(item.columns), selector: `data-price-prop="columns"`, placeholder: "แพ็กเกจ\nราคา\nเงื่อนไข", rows: 4 })}
        ${renderTextArea({ label: "แถวราคา (ใช้ Tab คั่นช่อง)", value: ensureArray(item.rows).map((row) => ensureArray(row).join("\t")).join("\n"), selector: `data-price-prop="rows"`, placeholder: "1 เดือน\t5,000 บาท\t-", rows: 8 })}
        ${renderTextArea({ label: "หมายเหตุ", value: item.noteTh, selector: `data-price-prop="noteTh"`, rows: 3 })}
      </div>
      <div class="admin-inline-actions">
        <button class="btn btn-ghost" type="button" data-action="delete-price-item">ลบรายการราคานี้</button>
      </div>
    </div>
  `;
}

function createPriceItem() {
  return {
    id: newId("price"),
    categoryId: "custom",
    nameTh: "รายการราคาใหม่",
    groupLabel: "Price",
    columns: ["รายการ", "ราคา"],
    rows: [["รายการใหม่", "0 บาท"]],
    noteTh: ""
  };
}

function renderServicesEditor() {
  const services = ensureArray(adminState.currentData);
  adminState.currentData = services;

  if (!services.length) {
    services.push(createServiceItem());
  }

  if (adminState.serviceIndex >= services.length) {
    adminState.serviceIndex = 0;
  }

  const service = services[adminState.serviceIndex];
  const options = services.map((item, index) => ({
    value: index,
    label: `${item.sortOrder || index + 1}. ${item.nameTh || item.id || "บริการ"}`
  }));

  return `
    <div class="admin-form-section">
      <div class="admin-section-title">
        <div>
          <h3>บริการของ MOSSA</h3>
          <p>แก้ชื่อ รายละเอียด รูป ป้าย และการผูกกับรายการราคา</p>
        </div>
        <button class="btn btn-secondary" type="button" data-action="add-service">เพิ่มบริการ</button>
      </div>

      ${renderSelect({ label: "เลือกบริการ", value: adminState.serviceIndex, selector: `id="service-select"`, options })}

      <div class="admin-form-grid">
        ${renderTextField({ label: "ID บริการ", value: service.id, selector: `data-service-prop="id"` })}
        ${renderTextField({ label: "ลำดับ", value: service.sortOrder, selector: `data-service-prop="sortOrder"`, type: "number" })}
        ${renderSelect({ label: "สถานะ", value: service.status || "active", selector: `data-service-prop="status"`, options: [
          { value: "active", label: "แสดงบนเว็บ" },
          { value: "inactive", label: "ซ่อนจากเว็บ" }
        ] })}
        ${renderTextField({ label: "หมวด", value: service.categoryLabel, selector: `data-service-prop="categoryLabel"` })}
        ${renderTextField({ label: "รหัสหมวด", value: service.categoryId, selector: `data-service-prop="categoryId"` })}
        ${renderTextField({ label: "ชื่อบริการ", value: service.nameTh, selector: `data-service-prop="nameTh"` })}
        ${renderTextArea({ label: "คำอธิบายสั้น", value: service.shortDescriptionTh, selector: `data-service-prop="shortDescriptionTh"`, rows: 3 })}
        ${renderTextArea({ label: "รายละเอียด", value: service.detailTh, selector: `data-service-prop="detailTh"`, rows: 4 })}
        ${renderTextArea({ label: "Bullet รายละเอียด (บรรทัดละ 1 ข้อ)", value: toLines(service.detailBullets), selector: `data-service-prop="detailBullets"`, rows: 5 })}
        ${renderTextField({ label: "ID ราคาที่ต้องแสดง (คั่นด้วย comma)", value: toCommaList(service.priceItemIds), selector: `data-service-prop="priceItemIds"` })}
        ${renderTextField({ label: "ลิงก์รูป", value: service.imageUrl, selector: `data-service-prop="imageUrl"` })}
        ${renderTextField({ label: "แท็ก (คั่นด้วย comma)", value: toCommaList(service.tags), selector: `data-service-prop="tags"` })}
        ${renderTextField({ label: "ชื่อปุ่มลงทะเบียน", value: service.registrationLabel, selector: `data-service-prop="registrationLabel"` })}
        ${renderTextField({ label: "ลิงก์ลงทะเบียน", value: service.registrationUrl, selector: `data-service-prop="registrationUrl"` })}
      </div>
      <div class="admin-inline-actions">
        <button class="btn btn-ghost" type="button" data-action="duplicate-service">คัดลอกบริการนี้</button>
        <button class="btn btn-ghost" type="button" data-action="delete-service">ลบบริการนี้</button>
      </div>
    </div>
  `;
}

function createServiceItem() {
  return {
    id: newId("service"),
    categoryId: "custom",
    categoryLabel: "Custom",
    nameTh: "บริการใหม่",
    shortDescriptionTh: "",
    detailTh: "",
    detailBullets: [],
    priceItemIds: [],
    imageUrl: "",
    tags: [],
    sortOrder: ensureArray(adminState.currentData).length + 1,
    status: "active"
  };
}

function renderScheduleEditor() {
  const schedule = adminState.currentData || {};
  adminState.currentData = schedule;

  return `
    <div class="admin-form-section">
      <div class="admin-section-title">
        <div>
          <h3>ตารางคลาสแบบรูป</h3>
          <p>ใส่ path หรือ URL ของรูปตารางคลาสรายเดือน เช่น assets/class-schedule-july.jpg</p>
        </div>
      </div>
      <div class="admin-form-grid">
        ${renderTextField({ label: "เดือน/รหัส", value: schedule.month, selector: `data-root-prop="month"` })}
        ${renderTextField({ label: "หัวข้อบนเว็บ", value: schedule.monthLabel, selector: `data-root-prop="monthLabel"` })}
        ${renderTextField({ label: "ลิงก์รูปตารางคลาส", value: schedule.imageUrl, selector: `data-root-prop="imageUrl"` })}
        ${renderTextField({ label: "ลิงก์ดาวน์โหลด", value: schedule.downloadUrl, selector: `data-root-prop="downloadUrl"` })}
        ${renderTextArea({ label: "หมายเหตุ", value: schedule.noteTh, selector: `data-root-prop="noteTh"`, rows: 3 })}
      </div>
    </div>
  `;
}

function renderContactEditor() {
  const contact = adminState.currentData || {};
  adminState.currentData = contact;

  return `
    <div class="admin-form-section">
      <div class="admin-section-title">
        <div>
          <h3>ข้อมูลติดต่อ</h3>
          <p>แก้ช่องทางหลัก เบอร์โทร โซเชียล ที่อยู่ และลิงก์แผนที่</p>
        </div>
      </div>
      <div class="admin-form-grid">
        ${renderTextField({ label: "ชื่อแบรนด์", value: contact.brandName, selector: `data-root-prop="brandName"` })}
        ${renderTextField({ label: "SEO Title", value: contact.seoTitle, selector: `data-root-prop="seoTitle"` })}
        ${renderTextField({ label: "Tagline EN", value: contact.taglineEn, selector: `data-root-prop="taglineEn"` })}
        ${renderTextField({ label: "Tagline TH", value: contact.taglineTh, selector: `data-root-prop="taglineTh"` })}
        ${renderTextField({ label: "LINE OA", value: contact.lineOa, selector: `data-root-prop="lineOa"` })}
        ${renderTextField({ label: "LINE Link", value: contact.lineUrl, selector: `data-root-prop="lineUrl"` })}
        ${renderTextField({ label: "Facebook", value: contact.facebookName, selector: `data-root-prop="facebookName"` })}
        ${renderTextField({ label: "Facebook Inbox", value: contact.facebookInboxUrl, selector: `data-root-prop="facebookInboxUrl"` })}
        ${renderTextArea({ label: "เบอร์หลัก (บรรทัดละ 1 เบอร์)", value: toLines(contact.mainPhones), selector: `data-root-prop="mainPhones"`, rows: 3 })}
        ${renderTextField({ label: "เบอร์จองสนาม", value: contact.fieldBookingPhone, selector: `data-root-prop="fieldBookingPhone"` })}
        ${renderTextField({ label: "Instagram", value: contact.instagram, selector: `data-root-prop="instagram"` })}
        ${renderTextField({ label: "TikTok", value: contact.tiktok, selector: `data-root-prop="tiktok"` })}
        ${renderTextArea({ label: "ที่อยู่", value: contact.addressTh, selector: `data-root-prop="addressTh"`, rows: 3 })}
        ${renderTextField({ label: "Google Maps URL", value: contact.googleMapsUrl, selector: `data-root-prop="googleMapsUrl"` })}
      </div>
    </div>
  `;
}

function renderCorporateEditor() {
  const companies = ensureArray(adminState.currentData);
  adminState.currentData = companies;

  if (!companies.length) {
    companies.push(createCompanyItem());
  }

  if (adminState.corporateIndex >= companies.length) {
    adminState.corporateIndex = 0;
  }

  const company = companies[adminState.corporateIndex];
  company.rights = company.rights || {};
  const options = companies.map((item, index) => ({
    value: index,
    label: `${index + 1}. ${item.companyNameTh || item.companyNameEn || "บริษัท"}`
  }));

  return `
    <div class="admin-form-section">
      <div class="admin-section-title">
        <div>
          <h3>บริษัทคู่สัญญา</h3>
          <p>แก้ชื่อบริษัท คำค้นหา สิทธิ์ และเงื่อนไขที่แสดงหลังค้นหา</p>
        </div>
        <button class="btn btn-secondary" type="button" data-action="add-company">เพิ่มบริษัท</button>
      </div>
      ${renderSelect({ label: "เลือกบริษัท", value: adminState.corporateIndex, selector: `id="company-select"`, options })}
      <div class="admin-form-grid">
        ${renderTextField({ label: "ชื่อบริษัท TH", value: company.companyNameTh, selector: `data-company-prop="companyNameTh"` })}
        ${renderTextField({ label: "ชื่อบริษัท EN", value: company.companyNameEn, selector: `data-company-prop="companyNameEn"` })}
        ${renderTextField({ label: "คำค้นหา (คั่นด้วย comma)", value: toCommaList(company.searchKeywords), selector: `data-company-prop="searchKeywords"` })}
        ${renderTextField({ label: "พนักงานใช้ฟิตเนส", value: company.rights.employeeFitness, selector: `data-company-right="employeeFitness"` })}
        ${renderTextField({ label: "พนักงานใช้สระ", value: company.rights.employeePool, selector: `data-company-right="employeePool"` })}
        ${renderTextField({ label: "ครอบครัวใช้ฟิตเนส", value: company.rights.familyFitness, selector: `data-company-right="familyFitness"` })}
        ${renderTextField({ label: "ครอบครัวใช้สระ", value: company.rights.familyPool, selector: `data-company-right="familyPool"` })}
        ${renderTextArea({ label: "เงื่อนไขที่แสดง", value: company.publicConditionTh, selector: `data-company-prop="publicConditionTh"`, rows: 4 })}
      </div>
      <div class="admin-inline-actions">
        <button class="btn btn-ghost" type="button" data-action="delete-company">ลบบริษัทนี้</button>
      </div>
    </div>
  `;
}

function createCompanyItem() {
  return {
    companyNameTh: "บริษัทใหม่",
    companyNameEn: "",
    searchKeywords: [],
    rights: {
      employeeFitness: "รอยืนยัน",
      employeePool: "รอยืนยัน",
      familyFitness: "รอยืนยัน",
      familyPool: "รอยืนยัน"
    },
    publicConditionTh: ""
  };
}

function renderGalleryEditor() {
  const gallery = ensureArray(adminState.currentData);
  adminState.currentData = gallery;

  return `
    <div class="admin-form-section">
      <div class="admin-section-title">
        <div>
          <h3>รูปภาพ</h3>
          <p>แก้ชื่อรูป คำอธิบาย และลิงก์รูปที่แสดงในแกลเลอรี</p>
        </div>
        <button class="btn btn-secondary" type="button" data-action="add-gallery">เพิ่มรูป</button>
      </div>
      <div class="admin-repeat-list">
        ${gallery.map((item, index) => `
          <article class="admin-repeat-item">
            <div class="admin-repeat-head">
              <strong>${escapeHtml(item.titleTh || `รูป ${index + 1}`)}</strong>
              <button class="btn btn-ghost" type="button" data-action="remove-gallery" data-index="${index}">ลบ</button>
            </div>
            <div class="admin-form-grid">
              ${renderTextField({ label: "ชื่อรูป", value: item.titleTh, selector: `data-gallery-index="${index}" data-prop="titleTh"` })}
              ${renderTextField({ label: "ลิงก์รูป", value: item.imageUrl, selector: `data-gallery-index="${index}" data-prop="imageUrl"` })}
              ${renderTextArea({ label: "หมายเหตุ", value: item.noteTh, selector: `data-gallery-index="${index}" data-prop="noteTh"`, rows: 3 })}
            </div>
          </article>
        `).join("") || `<div class="empty-state">ยังไม่มีรูปภาพ</div>`}
      </div>
    </div>
  `;
}

function renderTrialEditor() {
  const trial = adminState.currentData || { items: [] };
  trial.items = ensureArray(trial.items);
  adminState.currentData = trial;

  return `
    <div class="admin-form-section">
      <div class="admin-section-title">
        <div>
          <h3>ทดลองฟรี 3 วัน</h3>
          <p>แก้ข้อความเงื่อนไข Trial ที่ให้ลูกค้านำบัตรประชาชนมายื่นที่เคาน์เตอร์</p>
        </div>
        <button class="btn btn-secondary" type="button" data-action="add-trial-item">เพิ่มข้อ Trial</button>
      </div>
      <div class="admin-form-grid">
        ${renderTextField({ label: "หัวข้อ", value: trial.titleTh, selector: `data-root-prop="titleTh"` })}
        ${renderTextArea({ label: "เงื่อนไขหลัก", value: trial.eligibilityTh, selector: `data-root-prop="eligibilityTh"`, rows: 3 })}
      </div>
      <div class="admin-repeat-list">
        ${trial.items.map((item, index) => `
          <article class="admin-repeat-item">
            <div class="admin-repeat-head">
              <strong>${escapeHtml(item.title || `ข้อ ${index + 1}`)}</strong>
              <button class="btn btn-ghost" type="button" data-action="remove-trial-item" data-index="${index}">ลบ</button>
            </div>
            <div class="admin-form-grid">
              ${renderTextField({ label: "หัวข้อย่อย", value: item.title, selector: `data-trial-index="${index}" data-prop="title"` })}
              ${renderTextArea({ label: "รายละเอียด", value: item.body, selector: `data-trial-index="${index}" data-prop="body"`, rows: 3 })}
            </div>
          </article>
        `).join("")}
      </div>
    </div>
  `;
}

function renderFaqEditor() {
  const faq = ensureArray(adminState.currentData);
  adminState.currentData = faq;

  return `
    <div class="admin-form-section">
      <div class="admin-section-title">
        <div>
          <h3>FAQ</h3>
          <p>แก้คำถามที่พบบ่อยและคำตอบที่แสดงหน้าเว็บ</p>
        </div>
        <button class="btn btn-secondary" type="button" data-action="add-faq">เพิ่ม FAQ</button>
      </div>
      <div class="admin-repeat-list">
        ${faq.map((item, index) => `
          <article class="admin-repeat-item">
            <div class="admin-repeat-head">
              <strong>${escapeHtml(item.questionTh || `FAQ ${index + 1}`)}</strong>
              <button class="btn btn-ghost" type="button" data-action="remove-faq" data-index="${index}">ลบ</button>
            </div>
            <div class="admin-form-grid">
              ${renderTextField({ label: "คำถาม", value: item.questionTh, selector: `data-faq-index="${index}" data-prop="questionTh"` })}
              ${renderTextArea({ label: "คำตอบ", value: item.answerTh, selector: `data-faq-index="${index}" data-prop="answerTh"`, rows: 4 })}
            </div>
          </article>
        `).join("") || `<div class="empty-state">ยังไม่มี FAQ</div>`}
      </div>
    </div>
  `;
}

function renderHoursEditor() {
  const hours = ensureArray(adminState.currentData);
  adminState.currentData = hours;

  if (!hours.length) {
    hours.push(createHourItem());
  }

  if (adminState.hourIndex >= hours.length) {
    adminState.hourIndex = 0;
  }

  const hour = hours[adminState.hourIndex];
  const options = hours.map((item, index) => ({
    value: index,
    label: `${index + 1}. ${item.serviceTh || "บริการ"}`
  }));

  return `
    <div class="admin-form-section">
      <div class="admin-section-title">
        <div>
          <h3>เวลาเปิดบริการ</h3>
          <p>แก้เวลาเปิดปิดแยกตามบริการ แต่ละแถวใช้รูปแบบ วัน | เวลา</p>
        </div>
        <button class="btn btn-secondary" type="button" data-action="add-hour">เพิ่มเวลาเปิดบริการ</button>
      </div>
      ${renderSelect({ label: "เลือกบริการ", value: adminState.hourIndex, selector: `id="hour-select"`, options })}
      <div class="admin-form-grid">
        ${renderTextField({ label: "ชื่อบริการ", value: hour.serviceTh, selector: `data-hour-prop="serviceTh"` })}
        ${renderTextArea({ label: "เวลา (วัน | เวลา)", value: ensureArray(hour.times).map((item) => `${item.days || ""} | ${item.time || ""}`).join("\n"), selector: `data-hour-prop="times"`, rows: 5 })}
        ${renderTextArea({ label: "หมายเหตุ", value: hour.noteTh, selector: `data-hour-prop="noteTh"`, rows: 3 })}
      </div>
      <div class="admin-inline-actions">
        <button class="btn btn-ghost" type="button" data-action="delete-hour">ลบเวลานี้</button>
      </div>
    </div>
  `;
}

function createHourItem() {
  return {
    serviceTh: "บริการใหม่",
    times: [{ days: "ทุกวัน", time: "08:00-22:00 น." }],
    noteTh: ""
  };
}

function renderTrainersEditor() {
  const trainers = ensureArray(adminState.currentData);
  adminState.currentData = trainers;

  if (!trainers.length) {
    trainers.push({ nameTh: "Trainer", specialtyTh: "", status: "placeholder" });
  }

  if (adminState.trainerIndex >= trainers.length) {
    adminState.trainerIndex = 0;
  }

  const trainer = trainers[adminState.trainerIndex];
  const options = trainers.map((item, index) => ({
    value: index,
    label: `${index + 1}. ${item.nameTh || "Trainer"}`
  }));

  return `
    <div class="admin-form-section">
      <div class="admin-section-title">
        <div>
          <h3>เทรนเนอร์</h3>
          <p>ข้อมูลนี้เตรียมไว้สำหรับเฟสที่มีหน้า Trainer</p>
        </div>
        <button class="btn btn-secondary" type="button" data-action="add-trainer">เพิ่มเทรนเนอร์</button>
      </div>
      ${renderSelect({ label: "เลือกเทรนเนอร์", value: adminState.trainerIndex, selector: `id="trainer-select"`, options })}
      <div class="admin-form-grid">
        ${renderTextField({ label: "ชื่อ", value: trainer.nameTh, selector: `data-trainer-prop="nameTh"` })}
        ${renderTextField({ label: "ชื่อที่แสดงบนเว็บ", value: trainer.displayNameTh, selector: `data-trainer-prop="displayNameTh"` })}
        ${renderTextField({ label: "ชื่ออังกฤษ", value: trainer.fullNameEn, selector: `data-trainer-prop="fullNameEn"` })}
        ${renderTextField({ label: "ความเชี่ยวชาญ", value: trainer.specialtyTh, selector: `data-trainer-prop="specialtyTh"` })}
        ${renderTextField({ label: "ลำดับแสดงผล", value: trainer.sortOrder, type: "number", selector: `data-trainer-prop="sortOrder"` })}
        ${renderTextField({ label: "สถานะ", value: trainer.status, selector: `data-trainer-prop="status"` })}
        ${renderTextField({ label: "ลิงก์รูป", value: trainer.imageUrl, selector: `data-trainer-prop="imageUrl"` })}
      </div>
      <div class="admin-inline-actions">
        <button class="btn btn-ghost" type="button" data-action="delete-trainer">ลบเทรนเนอร์นี้</button>
      </div>
    </div>
  `;
}

function renderJsonPanel() {
  return `
    <details class="admin-json-panel">
      <summary>แก้ JSON โดยตรง</summary>
      <p>ใช้กรณีต้องแก้ข้อมูลละเอียดที่ฟอร์มยังไม่รองรับ ระบบจะตรวจว่า JSON ถูกต้องก่อนบันทึก</p>
      <textarea id="admin-json-editor" rows="16" spellcheck="false"></textarea>
      <div class="admin-inline-actions">
        <button class="btn btn-ghost" type="button" id="format-json">จัดรูปแบบ JSON</button>
        <button class="btn btn-ghost" type="button" id="apply-json">ใช้ JSON นี้กับฟอร์ม</button>
      </div>
    </details>
  `;
}

function updateRawFromState() {
  const editor = qs("#admin-json-editor");
  if (!editor) return;
  editor.value = JSON.stringify(adminState.currentData, null, 2);
}

function parseRawEditor() {
  const editor = qs("#admin-json-editor");
  if (!editor) {
    return adminState.currentData;
  }

  try {
    const parsed = JSON.parse(editor.value);
    adminState.currentData = parsed;
    return parsed;
  } catch (error) {
    throw new Error(`JSON ไม่ถูกต้อง: ${error.message}`);
  }
}

function markChanged() {
  updateRawFromState();
  setStatus("มีการแก้ไขที่ยังไม่ได้บันทึก", "warn");
}

function updateRootProp(prop, value) {
  if (!adminState.currentData || typeof adminState.currentData !== "object") return;

  if (prop === "mainPhones") {
    adminState.currentData[prop] = fromLines(value);
  } else {
    adminState.currentData[prop] = value;
  }

  markChanged();
}

function attachStructuredHandlers(key) {
  const body = qs("#admin-editor-body");
  if (!body) return;

  body.querySelectorAll("[data-root-prop]").forEach((input) => {
    input.addEventListener("input", () => updateRootProp(input.dataset.rootProp, input.value));
  });

  if (key === "promotions") attachPromotionHandlers(body);
  if (key === "pricing") attachPricingHandlers(body);
  if (key === "services") attachServiceHandlers(body);
  if (key === "corporates") attachCorporateHandlers(body);
  if (key === "gallery") attachGalleryHandlers(body);
  if (key === "trial") attachTrialHandlers(body);
  if (key === "faq") attachFaqHandlers(body);
  if (key === "hours") attachHourHandlers(body);
  if (key === "trainers") attachTrainerHandlers(body);
}

function attachPromotionHandlers(body) {
  body.querySelectorAll("[data-promotion-index]").forEach((input) => {
    input.addEventListener("input", () => {
      const item = adminState.currentData[Number(input.dataset.promotionIndex)];
      if (!item) return;
      item[input.dataset.prop] = input.value;
      markChanged();
    });
  });

  body.querySelector("[data-action='add-promotion']")?.addEventListener("click", () => {
    adminState.currentData.push({ label: "Promotion", titleTh: "โปรโมชันใหม่", descriptionTh: "", statusText: "แสดงบนเว็บ", status: "active", expiresAt: "", expiresLabel: "" });
    renderEditor();
    markChanged();
  });

  body.querySelectorAll("[data-action='remove-promotion']").forEach((button) => {
    button.addEventListener("click", () => {
      adminState.currentData.splice(Number(button.dataset.index), 1);
      renderEditor();
      markChanged();
    });
  });
}

function attachPricingHandlers(body) {
  body.querySelector("#price-item-select")?.addEventListener("change", (event) => {
    adminState.priceIndex = Number(event.target.value);
    renderEditor();
  });

  body.querySelectorAll("[data-price-prop]").forEach((input) => {
    input.addEventListener("input", () => {
      const item = adminState.currentData.items[adminState.priceIndex];
      if (!item) return;

      if (input.dataset.priceProp === "columns") {
        item.columns = fromLines(input.value);
      } else if (input.dataset.priceProp === "rows") {
        item.rows = String(input.value || "")
          .split(/\r?\n/)
          .filter((line) => line.trim())
          .map((line) => line.split("\t").map((cell) => cell.trim()));
      } else {
        item[input.dataset.priceProp] = input.value;
      }

      markChanged();
    });
  });

  body.querySelector("[data-action='add-price-item']")?.addEventListener("click", () => {
    adminState.currentData.items.push(createPriceItem());
    adminState.priceIndex = adminState.currentData.items.length - 1;
    renderEditor();
    markChanged();
  });

  body.querySelector("[data-action='delete-price-item']")?.addEventListener("click", () => {
    if (adminState.currentData.items.length <= 1) {
      setStatus("ต้องเหลือรายการราคาอย่างน้อย 1 รายการ", "error");
      return;
    }
    adminState.currentData.items.splice(adminState.priceIndex, 1);
    adminState.priceIndex = Math.max(0, adminState.priceIndex - 1);
    renderEditor();
    markChanged();
  });
}

function attachServiceHandlers(body) {
  body.querySelector("#service-select")?.addEventListener("change", (event) => {
    adminState.serviceIndex = Number(event.target.value);
    renderEditor();
  });

  body.querySelectorAll("[data-service-prop]").forEach((input) => {
    input.addEventListener("input", () => {
      const item = adminState.currentData[adminState.serviceIndex];
      if (!item) return;
      const prop = input.dataset.serviceProp;

      if (prop === "detailBullets") {
        item[prop] = fromLines(input.value);
      } else if (prop === "priceItemIds" || prop === "tags") {
        item[prop] = fromCommaList(input.value);
      } else if (prop === "sortOrder") {
        item[prop] = Number(input.value || 0);
      } else {
        item[prop] = input.value;
      }

      markChanged();
    });
  });

  body.querySelector("[data-action='add-service']")?.addEventListener("click", () => {
    adminState.currentData.push(createServiceItem());
    adminState.serviceIndex = adminState.currentData.length - 1;
    renderEditor();
    markChanged();
  });

  body.querySelector("[data-action='duplicate-service']")?.addEventListener("click", () => {
    const item = clone(adminState.currentData[adminState.serviceIndex]);
    item.id = newId(item.id || "service");
    item.nameTh = `${item.nameTh || "บริการ"} Copy`;
    item.sortOrder = adminState.currentData.length + 1;
    adminState.currentData.push(item);
    adminState.serviceIndex = adminState.currentData.length - 1;
    renderEditor();
    markChanged();
  });

  body.querySelector("[data-action='delete-service']")?.addEventListener("click", () => {
    if (adminState.currentData.length <= 1) {
      setStatus("ต้องเหลือบริการอย่างน้อย 1 รายการ", "error");
      return;
    }
    adminState.currentData.splice(adminState.serviceIndex, 1);
    adminState.serviceIndex = Math.max(0, adminState.serviceIndex - 1);
    renderEditor();
    markChanged();
  });
}

function attachCorporateHandlers(body) {
  body.querySelector("#company-select")?.addEventListener("change", (event) => {
    adminState.corporateIndex = Number(event.target.value);
    renderEditor();
  });

  body.querySelectorAll("[data-company-prop]").forEach((input) => {
    input.addEventListener("input", () => {
      const item = adminState.currentData[adminState.corporateIndex];
      if (!item) return;
      if (input.dataset.companyProp === "searchKeywords") {
        item.searchKeywords = fromCommaList(input.value);
      } else {
        item[input.dataset.companyProp] = input.value;
      }
      markChanged();
    });
  });

  body.querySelectorAll("[data-company-right]").forEach((input) => {
    input.addEventListener("input", () => {
      const item = adminState.currentData[adminState.corporateIndex];
      if (!item) return;
      item.rights = item.rights || {};
      item.rights[input.dataset.companyRight] = input.value;
      markChanged();
    });
  });

  body.querySelector("[data-action='add-company']")?.addEventListener("click", () => {
    adminState.currentData.push(createCompanyItem());
    adminState.corporateIndex = adminState.currentData.length - 1;
    renderEditor();
    markChanged();
  });

  body.querySelector("[data-action='delete-company']")?.addEventListener("click", () => {
    if (adminState.currentData.length <= 1) {
      setStatus("ต้องเหลือบริษัทอย่างน้อย 1 รายการ", "error");
      return;
    }
    adminState.currentData.splice(adminState.corporateIndex, 1);
    adminState.corporateIndex = Math.max(0, adminState.corporateIndex - 1);
    renderEditor();
    markChanged();
  });
}

function attachGalleryHandlers(body) {
  body.querySelectorAll("[data-gallery-index]").forEach((input) => {
    input.addEventListener("input", () => {
      const item = adminState.currentData[Number(input.dataset.galleryIndex)];
      if (!item) return;
      item[input.dataset.prop] = input.value;
      markChanged();
    });
  });

  body.querySelector("[data-action='add-gallery']")?.addEventListener("click", () => {
    adminState.currentData.push({ titleTh: "รูปใหม่", noteTh: "", imageUrl: "" });
    renderEditor();
    markChanged();
  });

  body.querySelectorAll("[data-action='remove-gallery']").forEach((button) => {
    button.addEventListener("click", () => {
      adminState.currentData.splice(Number(button.dataset.index), 1);
      renderEditor();
      markChanged();
    });
  });
}

function attachTrialHandlers(body) {
  body.querySelectorAll("[data-trial-index]").forEach((input) => {
    input.addEventListener("input", () => {
      const item = adminState.currentData.items[Number(input.dataset.trialIndex)];
      if (!item) return;
      item[input.dataset.prop] = input.value;
      markChanged();
    });
  });

  body.querySelector("[data-action='add-trial-item']")?.addEventListener("click", () => {
    adminState.currentData.items.push({ title: "หัวข้อใหม่", body: "" });
    renderEditor();
    markChanged();
  });

  body.querySelectorAll("[data-action='remove-trial-item']").forEach((button) => {
    button.addEventListener("click", () => {
      adminState.currentData.items.splice(Number(button.dataset.index), 1);
      renderEditor();
      markChanged();
    });
  });
}

function attachFaqHandlers(body) {
  body.querySelectorAll("[data-faq-index]").forEach((input) => {
    input.addEventListener("input", () => {
      const item = adminState.currentData[Number(input.dataset.faqIndex)];
      if (!item) return;
      item[input.dataset.prop] = input.value;
      markChanged();
    });
  });

  body.querySelector("[data-action='add-faq']")?.addEventListener("click", () => {
    adminState.currentData.push({ questionTh: "คำถามใหม่", answerTh: "" });
    renderEditor();
    markChanged();
  });

  body.querySelectorAll("[data-action='remove-faq']").forEach((button) => {
    button.addEventListener("click", () => {
      adminState.currentData.splice(Number(button.dataset.index), 1);
      renderEditor();
      markChanged();
    });
  });
}

function attachHourHandlers(body) {
  body.querySelector("#hour-select")?.addEventListener("change", (event) => {
    adminState.hourIndex = Number(event.target.value);
    renderEditor();
  });

  body.querySelectorAll("[data-hour-prop]").forEach((input) => {
    input.addEventListener("input", () => {
      const item = adminState.currentData[adminState.hourIndex];
      if (!item) return;

      if (input.dataset.hourProp === "times") {
        item.times = String(input.value || "")
          .split(/\r?\n/)
          .filter((line) => line.trim())
          .map((line) => {
            const [days, ...timeParts] = line.split("|");
            return { days: (days || "").trim(), time: timeParts.join("|").trim() };
          });
      } else {
        item[input.dataset.hourProp] = input.value;
      }

      markChanged();
    });
  });

  body.querySelector("[data-action='add-hour']")?.addEventListener("click", () => {
    adminState.currentData.push(createHourItem());
    adminState.hourIndex = adminState.currentData.length - 1;
    renderEditor();
    markChanged();
  });

  body.querySelector("[data-action='delete-hour']")?.addEventListener("click", () => {
    if (adminState.currentData.length <= 1) {
      setStatus("ต้องเหลือเวลาเปิดบริการอย่างน้อย 1 รายการ", "error");
      return;
    }
    adminState.currentData.splice(adminState.hourIndex, 1);
    adminState.hourIndex = Math.max(0, adminState.hourIndex - 1);
    renderEditor();
    markChanged();
  });
}

function attachTrainerHandlers(body) {
  body.querySelector("#trainer-select")?.addEventListener("change", (event) => {
    adminState.trainerIndex = Number(event.target.value);
    renderEditor();
  });

  body.querySelectorAll("[data-trainer-prop]").forEach((input) => {
    input.addEventListener("input", () => {
      const item = adminState.currentData[adminState.trainerIndex];
      if (!item) return;
      item[input.dataset.trainerProp] = input.value;
      markChanged();
    });
  });

  body.querySelector("[data-action='add-trainer']")?.addEventListener("click", () => {
    adminState.currentData.push({ nameTh: "Trainer", displayNameTh: "เทรนเนอร์", fullNameEn: "", specialtyTh: "", sortOrder: adminState.currentData.length + 1, status: "active", imageUrl: "" });
    adminState.trainerIndex = adminState.currentData.length - 1;
    renderEditor();
    markChanged();
  });

  body.querySelector("[data-action='delete-trainer']")?.addEventListener("click", () => {
    if (adminState.currentData.length <= 1) {
      setStatus("ต้องเหลือเทรนเนอร์อย่างน้อย 1 รายการ", "error");
      return;
    }
    adminState.currentData.splice(adminState.trainerIndex, 1);
    adminState.trainerIndex = Math.max(0, adminState.trainerIndex - 1);
    renderEditor();
    markChanged();
  });
}

function attachJsonHandlers() {
  qs("#admin-json-editor")?.addEventListener("input", () => {
    setStatus("มีการแก้ JSON ที่ยังไม่ได้บันทึก", "warn");
  });

  qs("#format-json")?.addEventListener("click", () => {
    try {
      parseRawEditor();
      updateRawFromState();
      setStatus("จัดรูปแบบ JSON แล้ว", "success");
    } catch (error) {
      setStatus(error.message, "error");
    }
  });

  qs("#apply-json")?.addEventListener("click", () => {
    try {
      parseRawEditor();
      renderEditor();
      setStatus("ใช้ JSON นี้กับฟอร์มแล้ว", "success");
    } catch (error) {
      setStatus(error.message, "error");
    }
  });
}

async function saveCurrentData() {
  if (!adminState.currentKey) return;

  try {
    parseRawEditor();
    setEditorState(true);
    setStatus("กำลังบันทึกข้อมูล...", "warn");

    const payload = await apiJson(`/api/admin/data/${encodeURIComponent(adminState.currentKey)}`, {
      method: "POST",
      body: JSON.stringify({ data: adminState.currentData })
    });

    setStatus(`บันทึก ${payload.label} แล้ว`, "success");
    updateRawFromState();
  } catch (error) {
    setStatus(error.message, "error");
  } finally {
    setEditorState(false);
  }
}

function setupEvents() {
  qs("[data-menu-toggle]")?.addEventListener("click", () => {
    qs("[data-site-nav]")?.classList.toggle("is-open");
  });

  qs("#admin-login-form")?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const passcode = new FormData(event.currentTarget).get("passcode");
    await login(String(passcode || ""));
  });

  qs("#admin-logout")?.addEventListener("click", () => {
    sessionStorage.removeItem("mossaAdminPasscode");
    adminState.passcode = "";
    adminState.currentKey = "";
    adminState.currentData = null;
    showLogin();
    setStatus("");
  });

  qs("#reload-data")?.addEventListener("click", () => {
    if (adminState.currentKey) {
      selectFile(adminState.currentKey);
    }
  });

  qs("#save-data")?.addEventListener("click", saveCurrentData);
}

document.addEventListener("DOMContentLoaded", () => {
  setupEvents();

  const savedPasscode = sessionStorage.getItem("mossaAdminPasscode");
  if (savedPasscode) {
    qs("#admin-passcode").value = savedPasscode;
    login(savedPasscode);
  }
});
