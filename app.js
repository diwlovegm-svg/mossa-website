const DATA_FILES = {
  contact: "data/contact.json",
  about: "data/about.json",
  facilities: "data/facilities.json",
  experts: "data/experts.json",
  services: "data/services.json",
  pricing: "data/pricing.json",
  hours: "data/hours.json",
  schedule: "data/class-schedule.json",
  classinfo: "data/class-info.json",
  trainers: "data/trainers.json",
  corporates: "data/corporate-companies.json",
  promotions: "data/promotions.json",
  gallery: "data/gallery.json",
  trial: "data/trial-info.json",
  faq: "data/faq.json"
};

const API_BASE = "/api/content";

const state = {
  pricingCategory: "membership",
  classDay: "all",
  selectedServiceId: "",
  data: {}
};

const LANDING_SERVICE_CARDS = [
  {
    id: "fitness",
    title: "Fitness",
    summary: "โซนฟิตเนสสำหรับคาร์ดิโอ เวทเทรนนิ่ง และการออกกำลังกายประจำวัน"
  },
  {
    id: "group-class",
    title: "Group Class",
    summary: "คลาสออกกำลังกายหลากหลาย ทั้ง Les Mills, Yoga, Zumba, Tabata และคลาสยอดนิยม"
  },
  {
    id: "swimming-pool",
    title: "Swimming Pool",
    summary: "สระว่ายน้ำระบบน้ำเกลือ เหมาะทั้งว่ายออกกำลังกายและพักผ่อน"
  },
  {
    id: "sauna-steam",
    title: "Sauna / Steam",
    summary: "ซาวน่าและสตีมสำหรับผ่อนคลายหลังออกกำลังกาย ตามเงื่อนไขการใช้บริการ"
  },
  {
    id: "badminton-court",
    title: "Badminton Court",
    summary: "สนามแบดมินตันในร่ม จองเล่นเป็นรายชั่วโมง พร้อมเบอร์จองสนามโดยตรง"
  },
  {
    id: "football-field",
    title: "Football Field",
    summary: "สนามฟุตบอล Indoor และ Outdoor สำหรับทีมที่ต้องการจองสนามในระยอง"
  }
];

const MEMBERSHIP_PLAN_ROWS = [
  { label: "Day Pass", lookup: "รายวัน", helper: "ทดลองใช้บริการแบบรายวัน" },
  { label: "1 เดือน", lookup: "1 เดือน", helper: "เหมาะกับเริ่มต้นจริงจัง" },
  { label: "3 เดือน", lookup: "3 เดือน", helper: "คุ้มขึ้นสำหรับออกกำลังกายต่อเนื่อง" },
  { label: "6 เดือน", lookup: "6 เดือน", helper: "เหมาะกับคนที่วางเป้าหมายระยะกลาง" },
  { label: "12 เดือน", lookup: "12 เดือน", helper: "แพ็กเกจคุ้มสุดสำหรับสมาชิกประจำ" }
];

const CLASS_HIGHLIGHTS = ["BODY PUMP", "BODY COMBAT", "BODY JAM", "YOGA", "ZUMBA", "ABS", "TABATA", "STRETCH"];

const LANDING_FAQ = [
  {
    questionTh: "สมัครสมาชิกราคาเท่าไหร่?",
    answerTh: "แพ็กเกจสมาชิกเริ่มที่ Day Pass 500 บาท, 1 เดือน 5,000 บาท, 3 เดือน 9,900 บาท, 6 เดือน 17,500 บาท และ 12 เดือน 22,500 บาท สำหรับ 1 ท่าน"
  },
  {
    questionTh: "Day Pass ใช้อะไรได้บ้าง?",
    answerTh: "Day Pass 500 บาท ใช้บริการเหมือน Membership 1 วัน รวมผ้า และใช้ฟิตเนส สระว่ายน้ำ คลาสออกกำลังกาย ซาวน่า/สตีมได้ตามเงื่อนไข MOSSA"
  },
  {
    questionTh: "สมาชิกฟิตเนสเข้าคลาสได้ไหม?",
    answerTh: "สมาชิกฟิตเนสสามารถเข้าคลาสออกกำลังกายได้ตามเงื่อนไขของแพ็กเกจและตารางคลาสประจำเดือน"
  },
  {
    questionTh: "สิทธิ์ทดลองใช้บริการต้องทำอย่างไร?",
    answerTh: "ลูกค้าใหม่ที่ยังไม่เคยใช้บริการ MOSSA สามารถนำบัตรประชาชน 1 ใบมายื่นที่เคาน์เตอร์เพื่อสอบถามและใช้สิทธิ์ตามเงื่อนไขปัจจุบัน"
  },
  {
    questionTh: "สระว่ายน้ำเปิดกี่โมง?",
    answerTh: "สระว่ายน้ำเปิดจันทร์-ศุกร์ 08:00-21:30 น. และเสาร์-อาทิตย์/วันหยุดนักขัตฤกษ์ 08:00-20:30 น."
  },
  {
    questionTh: "จองสนามแบด/สนามบอลได้ที่ไหน?",
    answerTh: "โทรจองสนามแบดมินตันหรือสนามฟุตบอลได้ที่ 094-406-1555"
  },
  {
    questionTh: "มีซาวน่า/สตีมไหม?",
    answerTh: "มีซาวน่าและสตีม โดยค่าเข้าสระผู้ใหญ่ 150 บาทรวมซาวน่าและสตีมแล้ว และสมาชิกใช้ตามสิทธิ์แพ็กเกจ"
  },
  {
    questionTh: "ติดต่อ MOSSA ได้ช่องทางไหน?",
    answerTh: "ติดต่อได้ที่ LINE @Mossa2018 โทร 033-012-181, 094-696-6179 หรือจองสนามที่ 094-406-1555"
  }
];

const qs = (selector, root = document) => root.querySelector(selector);
const qsa = (selector, root = document) => [...root.querySelectorAll(selector)];

const EYEBROW_LABELS_TH = {
  "About MOSSA": "รู้จัก MOSSA",
  "Facilities": "สิ่งอำนวยความสะดวก",
  "Our Experts": "ทีมผู้เชี่ยวชาญ",
  "Vision": "วิสัยทัศน์"
};

function thaiEyebrow(label, fallback = "") {
  return EYEBROW_LABELS_TH[label] || label || fallback;
}

const CONVERSION_EVENTS = new Set([
  "click_line",
  "click_call",
  "click_pricing",
  "submit_lead_form",
  "click_class_schedule",
  "click_corporate_benefit"
]);

function trackConversion(eventName, payload = {}) {
  if (!CONVERSION_EVENTS.has(eventName)) return;

  const eventPayload = {
    event: eventName,
    source: "mossa_website",
    ...payload
  };

  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push(eventPayload);

  if (typeof window.gtag === "function") {
    window.gtag("event", eventName, eventPayload);
  }

  if (typeof window.fbq === "function") {
    window.fbq("trackCustom", eventName, eventPayload);
  }

  document.dispatchEvent(new CustomEvent("mossa:conversion", { detail: eventPayload }));
}

function initConversionTracking() {
  qsa("[data-track]").forEach((element) => {
    if (element.dataset.trackingBound === "true") return;

    element.dataset.trackingBound = "true";
    element.addEventListener("click", () => {
      trackConversion(element.dataset.track, {
        label: element.textContent.trim(),
        href: element.getAttribute("href") || "",
        location: element.dataset.trackLocation || ""
      });
    });
  });
}

window.mossaTrackConversion = trackConversion;

function createEl(tag, className, text) {
  const element = document.createElement(tag);
  if (className) element.className = className;
  if (text !== undefined) element.textContent = text;
  return element;
}

function money(value) {
  if (value === null || value === undefined || value === "") return "-";
  return Number(value).toLocaleString("th-TH");
}

async function loadData() {
  const entries = await Promise.all(
    Object.entries(DATA_FILES).map(async ([key, fallbackUrl]) => {
      try {
        const apiResponse = await fetch(`${API_BASE}/${key}`);
        if (apiResponse.ok) {
          const payload = await apiResponse.json();
          if (payload.ok && typeof payload.data !== "undefined") {
            return [key, payload.data];
          }
        }
      } catch (error) {
        // Static file fallback keeps local previews usable without the API server.
      }

      const response = await fetch(fallbackUrl);
      if (!response.ok) throw new Error(`${fallbackUrl} ${response.status}`);
      return [key, await response.json()];
    })
  );
  return Object.fromEntries(entries);
}

function initMenu() {
  const toggle = qs("[data-menu-toggle]");
  const nav = qs("[data-site-nav]");
  if (!toggle || !nav) return;

  toggle.addEventListener("click", () => {
    const open = nav.classList.toggle("is-open");
    toggle.setAttribute("aria-expanded", String(open));
  });

  nav.addEventListener("click", (event) => {
    if (event.target.matches("a")) {
      nav.classList.remove("is-open");
      toggle.setAttribute("aria-expanded", "false");
    }
  });
}

function applyTheme(theme) {
  const activeTheme = theme === "light" ? "light" : "dark";
  document.documentElement.dataset.theme = activeTheme;

  const label = qs("[data-theme-label]");
  const icon = qs("[data-theme-icon]");
  if (label) label.textContent = activeTheme === "light" ? "โหมดมืด" : "โหมดสว่าง";
  if (icon) icon.textContent = activeTheme === "light" ? "DARK" : "LIGHT";
}

function initThemeToggle() {
  const toggle = qs("[data-theme-toggle]");
  const savedTheme = localStorage.getItem("mossa-theme");
  applyTheme(savedTheme === "light" ? "light" : "dark");
  if (!toggle) return;

  toggle.addEventListener("click", () => {
    const nextTheme = document.documentElement.dataset.theme === "light" ? "dark" : "light";
    localStorage.setItem("mossa-theme", nextTheme);
    applyTheme(nextTheme);
  });
}

function initContactLinks(contact) {
  qsa("[data-line-link]").forEach((link) => {
    link.href = contact.lineUrl;
    if (!link.dataset.track) link.dataset.track = "click_line";
  });
  qsa("[data-main-phone]").forEach((link) => {
    link.href = `tel:${contact.mainPhones[0].replace(/-/g, "")}`;
    if (!link.dataset.track) link.dataset.track = "click_call";
  });
}

function initServiceModalEvents() {
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && qs("#service-detail")?.classList.contains("is-open")) {
      closeServiceDetail();
    }
  });
}

function openServiceById(serviceId, pricing) {
  const service = (state.data.services || []).find((item) => item.id === serviceId);
  if (!service) return;

  state.selectedServiceId = service.id;
  renderServiceDetail(service, pricing);
  qs("#services")?.scrollIntoView({ behavior: "smooth", block: "start" });
}

function initServiceShortcuts(pricing) {
  qsa("[data-service-open]").forEach((link) => {
    link.addEventListener("click", (event) => {
      event.preventDefault();
      openServiceById(link.dataset.serviceOpen, pricing);
    });
  });
}

function renderServices(services, pricing) {
  const grid = qs("#service-grid");
  if (!grid) return;
  grid.innerHTML = "";

  LANDING_SERVICE_CARDS.forEach((config) => {
    const service = services.find((item) => item.status === "active" && item.id === config.id);
    if (!service) return;

    const card = createEl("article", `service-card landing-service-card ${service.id === state.selectedServiceId ? "is-selected" : ""}`);
    card.dataset.serviceId = service.id;
    const image = createEl("div", "service-image");
    image.style.backgroundImage = `linear-gradient(180deg, rgba(9, 9, 13, 0.12), rgba(9, 9, 13, 0.7)), url("${service.imageUrl}")`;

    const body = createEl("div", "service-card-body");
    body.append(createEl("p", "eyebrow", service.categoryLabel));
    body.append(createEl("h3", "", config.title));
    body.append(createEl("p", "", config.summary || service.shortDescriptionTh));

    const meta = createEl("div", "service-meta");
    (service.tags || []).slice(0, 3).forEach((tag, index) => {
      meta.append(createEl("span", `tag ${index % 2 ? "orange" : ""}`, tag));
    });
    body.append(meta);

    const actions = createEl("div", "service-card-actions");
    const detailButton = createEl("button", "detail-link", "ดูรายละเอียด");
    detailButton.type = "button";
    detailButton.addEventListener("click", () => openServiceById(service.id, pricing));

    const askLink = createEl("a", "detail-link is-ask", "สอบถาม");
    askLink.href = state.data.contact?.lineUrl || "#lead";
    askLink.target = "_blank";
    askLink.rel = "noreferrer";

    actions.append(detailButton, askLink);
    body.append(actions);
    card.append(image, body);
    grid.append(card);
  });
}

function closeServiceDetail() {
  const detail = qs("#service-detail");
  state.selectedServiceId = "";
  document.body.classList.remove("service-modal-open");
  qsa(".service-card").forEach((card) => {
    card.classList.remove("is-selected");
    card.setAttribute("aria-pressed", "false");
  });
  if (!detail) return;
  detail.classList.remove("is-open");
  detail.removeAttribute("role");
  detail.removeAttribute("aria-modal");
  detail.removeAttribute("aria-label");
  detail.innerHTML = "";
}

function createPriceCard(item, categoryName, variant = "") {
  const card = createEl("article", ["price-card", variant].filter(Boolean).join(" "));
  card.append(createEl("p", "eyebrow", item.groupLabel || categoryName));
  card.append(createEl("h3", "", item.nameTh));

  if (item.rows?.length) {
    const rows = createEl("div", "price-row-list");
    item.rows.forEach((row) => {
      const rowCard = createEl("div", "price-row-card");
      rowCard.append(createEl("strong", "price-row-title", row[0] || "-"));

      const details = createEl("div", "price-row-details");
      row.slice(1).forEach((cell, index) => {
        const pair = createEl("div", "price-row-pair");
        pair.append(createEl("span", "", item.columns[index + 1] || ""));
        pair.append(createEl("b", "", cell || "-"));
        details.append(pair);
      });

      rowCard.append(details);
      rows.append(rowCard);
    });
    card.append(rows);
  } else {
    card.append(createEl("div", "price-value", item.priceText));
  }

  if (item.noteTh) card.append(createEl("p", "", item.noteTh));
  if (item.tags?.length) {
    const meta = createEl("div", "price-meta");
    item.tags.forEach((tag) => meta.append(createEl("span", "tag", tag)));
    card.append(meta);
  }
  return card;
}

function createInfoMeta(label, value) {
  const item = createEl("div", "info-meta-item");
  item.append(createEl("span", "", label));
  item.append(createEl("b", "", value || "-"));
  return item;
}

function createRelatedServiceExtras(parentService) {
  const relatedServices = (state.data.services || [])
    .filter((service) => service.status === "active" && service.parentServiceId === parentService.id)
    .sort((a, b) => a.sortOrder - b.sortOrder);

  if (!relatedServices.length) return null;

  const wrapper = createEl("div", "service-detail-extra");
  const section = createEl("section", "info-section");
  section.append(createEl("p", "eyebrow", "บริการที่เกี่ยวข้อง"));
  section.append(createEl("h3", "", "บริการในหมวดเดียวกัน"));
  section.append(createEl("p", "lead-text", `กด ${parentService.nameTh} เพียงครั้งเดียวเพื่อดูบริการย่อยและราคาในหมวดนี้`));

  const grid = createEl("div", "service-related-grid");
  relatedServices.forEach((service) => {
    const card = createEl("article", "service-related-card");
    card.append(createEl("p", "eyebrow", service.categoryLabel));
    card.append(createEl("h4", "", service.nameTh));
    card.append(createEl("p", "", service.shortDescriptionTh));

    if (service.detailBullets?.length) {
      const list = createEl("ul", "detail-list");
      service.detailBullets.slice(0, 3).forEach((item) => list.append(createEl("li", "", item)));
      card.append(list);
    }

    grid.append(card);
  });

  section.append(grid);
  wrapper.append(section);
  return wrapper;
}

function getActiveTrainers() {
  return (state.data.trainers || [])
    .filter((trainer) => trainer.status === "active")
    .sort((a, b) => (a.sortOrder || 999) - (b.sortOrder || 999));
}

function createTrainerCard(trainer) {
  const card = createEl("article", `trainer-card ${trainer.imageUrl ? "has-photo" : ""}`);

  if (trainer.imageUrl) {
    const photo = createEl("div", "trainer-photo");
    photo.style.backgroundImage = `linear-gradient(180deg, rgba(9, 9, 13, 0.02), rgba(9, 9, 13, 0.42)), url("${trainer.imageUrl}")`;
    photo.setAttribute("aria-label", trainer.nameTh || trainer.displayNameTh);
    card.append(photo);
  }

  const body = createEl("div", "trainer-card-body");
  body.append(createEl("h4", "", trainer.nameTh || trainer.displayNameTh));

  if (trainer.fullNameEn) body.append(createEl("p", "trainer-subtitle", trainer.fullNameEn));
  if (trainer.educationTh) body.append(createEl("p", "", trainer.educationTh));

  if (trainer.classes?.length) {
    const tags = createEl("div", "trainer-tags");
    trainer.classes.forEach((className) => tags.append(createEl("span", "tag", className)));
    body.append(tags);
  }

  if (trainer.certifications?.length) {
    const cert = createEl("p", "trainer-cert", `ใบรับรอง: ${trainer.certifications.slice(0, 3).join(", ")}`);
    body.append(cert);
  }

  card.append(body);
  return card;
}

function createGroupClassExtras() {
  const classDefinitions = state.data.classinfo?.classDefinitions || [];
  const trainers = getActiveTrainers();

  if (!classDefinitions.length && !trainers.length) return null;

  const wrapper = createEl("div", "service-detail-extra");

  if (classDefinitions.length) {
    const section = createEl("section", "info-section");
    section.append(createEl("p", "eyebrow", "ความหมายของคลาส"));
    section.append(createEl("h3", "", "ความหมายของคลาส"));
    section.append(createEl("p", "lead-text", state.data.classinfo?.noteTh || "คำอธิบายประเภทคลาสที่ใช้ในตารางคลาส MOSSA"));

    const grid = createEl("div", "class-definition-grid");
    classDefinitions.forEach((item) => {
      const card = createEl("article", `class-definition-card ${item.color ? `is-${item.color}` : ""}`);
      card.append(createEl("h4", "", item.name));
      card.append(createEl("p", "", item.descriptionTh));

      const meta = createEl("div", "class-definition-meta");
      meta.append(createInfoMeta("ประเภท", item.typeTh));
      meta.append(createInfoMeta("เวลา", item.durationTh));
      meta.append(createInfoMeta("กล้ามเนื้อ", item.musclesTh));
      meta.append(createInfoMeta("ผลลัพธ์", item.resultsTh));
      card.append(meta);
      grid.append(card);
    });

    section.append(grid);
    wrapper.append(section);
  }

  if (trainers.length) {
    const section = createEl("section", "info-section");
    section.append(createEl("p", "eyebrow", "เทรนเนอร์"));
    section.append(createEl("h3", "", "ทีมเทรนเนอร์ Group Class"));
    section.append(createEl("p", "lead-text", "ข้อมูลจากไฟล์ MOSSA ที่มีรายละเอียดชื่อ วุฒิ และคลาสที่สอน"));

    const grid = createEl("div", "trainer-grid");
    trainers.forEach((trainer) => {
      grid.append(createTrainerCard(trainer));
    });

    section.append(grid);
    wrapper.append(section);
  }

  return wrapper;
}

function renderServiceDetail(service, pricing) {
  const detail = qs("#service-detail");
  if (!detail) return;
  detail.innerHTML = "";
  detail.classList.add("is-open");
  detail.setAttribute("role", "dialog");
  detail.setAttribute("aria-modal", "true");
  detail.setAttribute("aria-label", `รายละเอียด ${service.nameTh}`);
  document.body.classList.add("service-modal-open");

  qsa(".service-card").forEach((card) => {
    const selected = card.dataset.serviceId === service.id;
    card.classList.toggle("is-selected", selected);
    card.setAttribute("aria-pressed", String(selected));
  });

  const backdrop = createEl("button", "service-detail-backdrop");
  backdrop.type = "button";
  backdrop.setAttribute("aria-label", "ปิดรายละเอียดบริการ");
  backdrop.addEventListener("click", closeServiceDetail);

  const shell = createEl("article", "service-detail-card");
  shell.tabIndex = -1;
  const closeButton = createEl("button", "service-close-button", "ปิด");
  closeButton.type = "button";
  closeButton.addEventListener("click", closeServiceDetail);
  shell.append(closeButton);

  const media = createEl("div", "service-detail-media");
  media.style.backgroundImage = `linear-gradient(180deg, rgba(9, 9, 13, 0.08), rgba(9, 9, 13, 0.82)), url("${service.imageUrl}")`;
  const mediaText = createEl("div", "service-detail-media-text");
  mediaText.append(createEl("p", "eyebrow", service.categoryLabel));
  mediaText.append(createEl("strong", "", service.nameTh));
  media.append(mediaText);
  shell.append(media);

  const intro = createEl("div", "service-detail-intro");
  intro.append(createEl("p", "eyebrow", service.categoryLabel));
  intro.append(createEl("h3", "", service.nameTh));
  intro.append(createEl("p", "lead-text", service.detailTh || service.shortDescriptionTh));

  if (service.detailBullets?.length) {
    const list = createEl("ul", "detail-list");
    service.detailBullets.forEach((item) => list.append(createEl("li", "", item)));
    intro.append(list);
  }

  const actionRow = createEl("div", "service-detail-actions");
  const priceBadge = createEl("span", "service-detail-badge", "ราคาอยู่ในหน้านี้");
  const contactLink = createEl("a", "btn btn-ghost", service.id === "court-field" ? "โทรจองสนาม" : "สอบถามเพิ่มเติม");
  const isFieldBooking = service.id === "badminton-court" || service.id === "football-field";
  contactLink.textContent = isFieldBooking ? "โทรจองสนาม" : "สอบถามเพิ่มเติม";
  contactLink.href = isFieldBooking ? "tel:0944061555" : state.data.contact.lineUrl;
  if (!isFieldBooking) {
    contactLink.target = "_blank";
    contactLink.rel = "noreferrer";
  }
  actionRow.append(priceBadge, contactLink);

  const registrationLinks = Array.isArray(service.registrationLinks)
    ? service.registrationLinks
    : service.registrationLabel
      ? [{ label: service.registrationLabel, url: service.registrationUrl }]
      : [];

  registrationLinks.forEach((registration) => {
    const label = registration.label || "ลงทะเบียน";
    const url = registration.url || registration.href || "";
    const registrationLink = createEl("a", url ? "btn btn-secondary" : "btn btn-disabled", url ? label : "สอบถามการลงทะเบียน");
    registrationLink.href = url || "#lead";
    if (url) {
      registrationLink.target = "_blank";
      registrationLink.rel = "noreferrer";
    }
    actionRow.append(registrationLink);
  });
  intro.append(actionRow);
  shell.append(intro);

  const priceWrap = createEl("div", "service-detail-prices");
  const itemIds = service.priceItemIds || [];
  const categoryIds = service.priceCategoryIds || [];
  const servicePriceItems = itemIds.length
    ? itemIds.map((id) => pricing.items.find((item) => item.id === id)).filter(Boolean)
    : pricing.items.filter((item) => categoryIds.includes(item.categoryId));

  if (servicePriceItems.length) {
    const noticeCategoryIds = [...new Set([...categoryIds, ...servicePriceItems.map((item) => item.categoryId)])];
    const categoryNotices = pricing.categories
      .filter((category) => noticeCategoryIds.includes(category.id) && category.notice)
      .map((category) => category.notice);

    categoryNotices.forEach((notice) => {
      const noticeEl = createEl("div", "empty-state", notice);
      noticeEl.style.gridColumn = "1 / -1";
      priceWrap.append(noticeEl);
    });

    servicePriceItems.forEach((item) => {
      const category = pricing.categories.find((categoryItem) => categoryItem.id === item.categoryId);
      priceWrap.append(createPriceCard(item, category?.nameTh || service.categoryLabel, "is-compact"));
    });
  } else {
    priceWrap.append(createEl("div", "empty-state", service.id === "group-class" ? "Group Class รวมอยู่ในสิทธิ์ Membership / Day Pass ตามเงื่อนไข MOSSA และดูรอบเรียนจากตารางคลาสรายเดือน" : "บริการนี้ดูรายละเอียดหลักจากตารางคลาสและช่องทางติดต่อ MOSSA"));
  }

  shell.append(priceWrap);
  const relatedExtras = createRelatedServiceExtras(service);
  if (relatedExtras) shell.append(relatedExtras);
  if (service.id === "group-class") {
    const extras = createGroupClassExtras();
    if (extras) shell.append(extras);
  }
  detail.append(backdrop, shell);
  requestAnimationFrame(() => shell.focus({ preventScroll: true }));
}

function renderPricingTabs(pricing) {
  const tabs = qs("#pricing-tabs");
  if (!tabs) return;
  tabs.innerHTML = "";
  tabs.classList.add("pricing-jump-list");

  pricing.categories.forEach((category) => {
    const button = createEl("button", "", category.nameTh);
    button.type = "button";
    button.addEventListener("click", () => {
      qs(`#price-category-${category.id}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
    tabs.append(button);
  });
}

function renderPricing(pricing) {
  const grid = qs("#pricing-content");
  if (!grid) return;
  grid.innerHTML = "";
  grid.classList.add("pricing-overview-grid");

  pricing.categories.forEach((category) => {
    const items = pricing.items.filter((item) => item.categoryId === category.id);
    if (!items.length) return;

    const section = createEl("section", "pricing-category");
    section.id = `price-category-${category.id}`;

    const head = createEl("div", "pricing-category-head");
    head.append(createEl("p", "eyebrow", category.nameTh));
    head.append(createEl("h3", "", category.nameTh));
    head.append(createEl("span", "pricing-count", `${items.length} รายการราคา`));
    section.append(head);

    if (category.notice) {
      section.append(createEl("div", "empty-state", category.notice));
    }

    const categoryGrid = createEl("div", "pricing-category-grid");
    items.forEach((item) => {
      categoryGrid.append(createPriceCard(item, category.nameTh, "is-overview"));
    });
    section.append(categoryGrid);
    grid.append(section);
  });
}

function renderMembershipPlans(pricing) {
  const grid = qs("#membership-plan-grid");
  if (!grid) return;
  grid.innerHTML = "";

  const membership = pricing.items.find((item) => item.id === "membership-packages");
  const rows = membership?.rows || [];

  MEMBERSHIP_PLAN_ROWS.forEach((plan, index) => {
    const row = rows.find((item) => item[0] === plan.lookup);
    if (!row) return;

    const card = createEl("article", `membership-plan-card ${index === 0 ? "is-day-pass" : ""} ${index === 4 ? "is-featured" : ""}`);
    card.append(createEl("p", "eyebrow", index === 0 ? "Day Pass" : "Membership"));
    card.append(createEl("h3", "", plan.label));
    card.append(createEl("strong", "membership-price", row[1]));
    card.append(createEl("p", "", plan.helper));

    const list = createEl("ul", "membership-list");
    [
      "ฟิตเนส",
      "คลาสออกกำลังกาย",
      "สระว่ายน้ำ",
      "ซาวน่า/สตีม",
      "ผ้าเช็ดตัวตามเงื่อนไขแพ็กเกจ"
    ].forEach((item) => list.append(createEl("li", "", item)));
    card.append(list);

    const cta = createEl("a", index === 4 ? "btn btn-primary" : "btn btn-secondary", "สอบถามสมาชิก");
    cta.href = state.data.contact?.lineUrl || "#lead";
    cta.target = "_blank";
    cta.rel = "noreferrer";
    cta.dataset.track = "click_line";
    cta.dataset.trackLocation = "membership_plan";
    card.append(cta);
    grid.append(card);
  });
}

function renderClassHighlights() {
  const grid = qs("#class-highlight-grid");
  if (!grid) return;
  grid.innerHTML = "";

  CLASS_HIGHLIGHTS.forEach((className) => {
    const item = createEl("article", "class-highlight-card");
    item.append(createEl("strong", "", className));
    item.append(createEl("span", "", "คลาสยอดนิยมของ MOSSA"));
    grid.append(item);
  });
}

function renderTrial(trial) {
  const title = qs("#trial-title");
  const eligibility = qs("#trial-eligibility");
  const steps = qs("#trial-steps");
  if (!title || !eligibility || !steps) return;

  title.textContent = trial.titleTh || "สอบถามสิทธิ์ทดลองใช้บริการ";
  eligibility.textContent = trial.eligibilityTh || "สอบถามสิทธิ์ทดลองใช้บริการได้ที่เคาน์เตอร์ MOSSA หรือผ่าน LINE";

  steps.innerHTML = "";
  (trial.items || []).forEach((item) => {
    const step = createEl("div", "trial-step");
    step.append(createEl("strong", "", item.title));
    step.append(createEl("span", "", item.body));
    steps.append(step);
  });
}

function renderHours(hours) {
  const grid = qs("#hours-grid");
  if (!grid) return;
  grid.innerHTML = "";

  hours.forEach((group) => {
    const card = createEl("article", "hour-card");
    card.append(createEl("h3", "", group.serviceTh));
    group.times.forEach((time) => {
      const line = createEl("p", "", `${time.days}: ${time.time}`);
      card.append(line);
    });
    if (group.noteTh) card.append(createEl("span", "status-pill", group.noteTh));
    grid.append(card);
  });
}

function renderClassFilters() {
  qsa("[data-day-filter]").forEach((button) => {
    button.classList.toggle("is-active", button.dataset.dayFilter === state.classDay);
    button.addEventListener("click", () => {
      state.classDay = button.dataset.dayFilter;
      qsa("[data-day-filter]").forEach((item) => item.classList.toggle("is-active", item === button));
      renderClasses(state.data.schedule);
    });
  });
}

function renderClasses(schedule) {
  const list = qs("#class-list");
  if (!list) return;
  list.innerHTML = "";

  if (!schedule.imageUrl) {
    list.append(createEl("div", "empty-state", "ยังไม่มีรูปตารางคลาสรายเดือน"));
    return;
  }

  const figure = createEl("figure", "class-image-card");
  const image = document.createElement("img");
  image.src = schedule.imageUrl;
  image.alt = schedule.monthLabel || "ตารางคลาสรายเดือน MOSSA";
  image.loading = "lazy";
  figure.append(image);

  const caption = createEl("figcaption", "");
  caption.append(createEl("strong", "", schedule.monthLabel || "ตารางคลาสรายเดือน"));
  caption.append(createEl("span", "", schedule.noteTh || "เปลี่ยนรูปไฟล์นี้เมื่อมีตารางคลาสเดือนใหม่"));

  if (schedule.downloadUrl) {
    const downloadLink = createEl("a", "btn btn-secondary", "ดูรูปตารางคลาส");
    downloadLink.href = schedule.downloadUrl;
    downloadLink.target = "_blank";
    downloadLink.rel = "noreferrer";
    downloadLink.dataset.track = "click_class_schedule";
    downloadLink.dataset.trackLocation = "class_schedule_image";
    caption.append(downloadLink);
  }

  figure.append(caption);
  list.append(figure);
}

function renderCorporate(corporates) {
  const input = qs("#corporate-query");
  const results = qs("#corporate-results");
  if (!input || !results) return;

  const draw = () => {
    const query = input.value.trim().toLowerCase();
    results.innerHTML = "";

    if (!query) {
      results.append(createEl("div", "empty-state", "พิมพ์ชื่อบริษัทของคุณเพื่อค้นหาสิทธิ์การใช้บริการ"));
      return;
    }

    const matches = corporates.filter((company) => {
      const keywords = [company.companyNameTh, company.companyNameEn, ...(company.searchKeywords || [])].join(" ").toLowerCase();
      return keywords.includes(query);
    });

    if (!matches.length) {
      results.append(createEl("div", "empty-state", "ไม่พบชื่อบริษัทนี้ กรุณาแอด LINE เพื่อตรวจสอบสิทธิ์กับ MOSSA"));
      return;
    }

    matches.forEach((company) => {
      const card = createEl("article", "corporate-card");
      card.append(createEl("h3", "", company.companyNameTh));
      card.append(createEl("p", "", company.publicConditionTh));

      const rights = createEl("div", "rights-grid");
      [
        ["พนักงานใช้ฟิตเนส", company.rights.employeeFitness],
        ["พนักงานใช้สระ", company.rights.employeePool],
        ["ครอบครัวใช้ฟิตเนส", company.rights.familyFitness],
        ["ครอบครัวใช้สระ", company.rights.familyPool]
      ].forEach(([label, value]) => {
        const box = createEl("div", "right-box");
        box.append(createEl("span", "", label));
        box.append(createEl("strong", "", value));
        rights.append(box);
      });
      card.append(rights);
      results.append(card);
    });
  };

  input.addEventListener("input", draw);
  draw();
}

function renderAbout(about) {
  const root = qs("#about-content");
  if (!root || !about) return;
  root.innerHTML = "";

  const intro = createEl("div", "about-intro");
  intro.append(createEl("p", "eyebrow", thaiEyebrow(about.eyebrow, "รู้จัก MOSSA")));
  intro.append(document.createTextNode(" "));
  intro.append(createEl("h2", "", about.titleTh || "รู้จัก MOSSA Sport Society"));
  intro.append(document.createTextNode(" "));
  intro.append(createEl("p", "lead-text", about.introTh || ""));

  const factGrid = createEl("div", "fact-grid");
  (about.facts || []).forEach((fact) => {
    const card = createEl("article", "fact-card");
    card.append(createEl("span", "", fact.label));
    card.append(document.createTextNode(" "));
    card.append(createEl("strong", "", fact.value));
    factGrid.append(card);
    factGrid.append(document.createTextNode(" "));
  });

  const vision = createEl("div", "vision-panel");
  vision.append(createEl("p", "eyebrow", "วิสัยทัศน์"));
  vision.append(document.createTextNode(" "));
  vision.append(createEl("h3", "", "แนวคิด MOSSA"));
  vision.append(document.createTextNode(" "));
  vision.append(createEl("p", "", about.visionTh || ""));

  const values = createEl("div", "value-grid");
  (about.values || []).forEach((value) => {
    const item = createEl("article", "value-card");
    item.append(createEl("span", "value-letter", value.letter));
    item.append(document.createTextNode(" "));
    item.append(createEl("strong", "", value.title));
    item.append(document.createTextNode(" "));
    item.append(createEl("p", "", value.descriptionTh));
    values.append(item);
    values.append(document.createTextNode(" "));
  });

  vision.append(document.createTextNode(" "));
  vision.append(values);
  root.append(intro, document.createTextNode(" "), factGrid, document.createTextNode(" "), vision);
}

function renderFacilities(facilities) {
  const root = qs("#facilities-content");
  if (!root || !facilities) return;
  root.innerHTML = "";

  (facilities.sections || []).forEach((section) => {
    const card = createEl("article", "facility-card");
    card.append(createEl("p", "eyebrow", thaiEyebrow(facilities.eyebrow, "สิ่งอำนวยความสะดวก")));
    card.append(createEl("h3", "", section.titleTh));
    card.append(createEl("p", "", section.summaryTh));

    const list = createEl("div", "facility-list");
    (section.items || []).forEach((item) => {
      const row = createEl("div", "facility-item");
      row.append(createEl("strong", "", item.titleTh));
      row.append(createEl("p", "", item.descriptionTh));
      list.append(row);
    });

    card.append(list);
    root.append(card);
  });
}

function renderExperts(experts, trainers = []) {
  const root = qs("#experts-content");
  if (!root || !experts) return;
  root.innerHTML = "";

  const summary = createEl("article", "expert-summary");
  summary.append(createEl("p", "eyebrow", thaiEyebrow(experts.eyebrow, "ทีมผู้เชี่ยวชาญ")));
  summary.append(createEl("h3", "", experts.trainerSummary?.headlineTh || "ทีมเทรนเนอร์"));
  summary.append(createEl("p", "", experts.trainerSummary?.descriptionTh || experts.introTh || ""));
  root.append(summary);

  const activeTrainers = [...trainers]
    .filter((trainer) => trainer.status === "active")
    .sort((a, b) => (a.sortOrder || 999) - (b.sortOrder || 999));

  if (activeTrainers.length) {
    const trainerSection = createEl("section", "trainer-profile-section");
    trainerSection.append(createEl("h3", "", "ทีมเทรนเนอร์ MOSSA"));
    trainerSection.append(createEl("p", "lead-text", "รูปและข้อมูลเทรนเนอร์จากชุดข้อมูล MOSSA ที่ใช้แสดงบนเว็บ"));

    const trainerGrid = createEl("div", "trainer-profile-grid");
    activeTrainers.forEach((trainer) => trainerGrid.append(createTrainerCard(trainer)));
    trainerSection.append(trainerGrid);
    root.append(trainerSection);
  }

  const coachGrid = createEl("div", "expert-grid");
  (experts.specialCoaches || []).forEach((coach) => {
    const card = createEl("article", "expert-card");
    card.append(createEl("span", "status-pill", coach.areaTh));
    card.append(createEl("h3", "", coach.nameTh));
    card.append(createEl("p", "", coach.descriptionTh));
    coachGrid.append(card);
  });
  root.append(coachGrid);

  const specialtyGrid = createEl("div", "specialty-grid");
  (experts.specialties || []).forEach((group) => {
    const card = createEl("article", "specialty-card");
    card.append(createEl("h3", "", group.titleTh));
    const list = createEl("ul", "");
    (group.items || []).forEach((item) => list.append(createEl("li", "", item)));
    card.append(list);
    specialtyGrid.append(card);
  });
  root.append(specialtyGrid);
}

function renderPromotions(promotions) {
  const grid = qs("#promotion-grid");
  if (!grid) return;
  grid.innerHTML = "";

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const activePromotions = promotions.filter((promotion) => {
    if (promotion.status === "hidden") return false;
    if (!promotion.expiresAt) return true;

    const expiry = new Date(`${promotion.expiresAt}T23:59:59+07:00`);
    return Number.isNaN(expiry.getTime()) || expiry >= today;
  });

  if (!activePromotions.length) {
    grid.append(createEl("div", "empty-state", "ยังไม่มีโปรโมชันที่เปิดแสดงในตอนนี้"));
    return;
  }

  activePromotions.forEach((promotion) => {
    const card = createEl("article", "promotion-card");
    card.append(createEl("p", "eyebrow", promotion.label));
    card.append(createEl("h3", "", promotion.titleTh));
    card.append(createEl("p", "", promotion.descriptionTh));
    card.append(createEl("span", "status-pill", promotion.statusText));
    if (promotion.expiresLabel) {
      card.append(createEl("p", "", promotion.expiresLabel));
    }
    grid.append(card);
  });
}

function renderGallery(gallery) {
  const grid = qs("#gallery-grid");
  if (!grid) return;
  grid.innerHTML = "";

  gallery.forEach((item) => {
    const card = createEl("article", "gallery-card");
    const image = createEl("div", "gallery-image");
    image.style.backgroundImage = `linear-gradient(180deg, rgba(9, 9, 13, 0.08), rgba(9, 9, 13, 0.68)), url("${item.imageUrl}")`;
    const body = createEl("div", "service-card-body");
    body.append(createEl("h3", "", item.titleTh));
    body.append(createEl("p", "", item.noteTh));
    card.append(image, body);
    grid.append(card);
  });
}

function renderContact(contact) {
  const address = qs("#contact-address");
  const mapStatus = qs("#map-status");
  const actions = qs("#contact-actions");
  if (!address || !mapStatus || !actions) return;

  address.textContent = contact.addressTh;
  mapStatus.textContent = contact.googleMapsUrl
    ? "กดปุ่มนำทางเพื่อเปิดแผนที่และวางเส้นทางมาที่ MOSSA"
    : "สอบถามเส้นทางและรายละเอียดการเดินทางได้ผ่าน LINE หรือโทรหา MOSSA";

  actions.innerHTML = "";
  const instagramHandle = String(contact.instagram || "").replace(/^@/, "");
  const tiktokHandle = String(contact.tiktok || "").startsWith("@") ? contact.tiktok : `@${contact.tiktok}`;

  const buttons = [
    ["ติดต่อผ่าน LINE", contact.lineUrl, "btn btn-primary", true, "click_line"],
    [`โทรหา MOSSA ${contact.mainPhones[0]}`, `tel:${contact.mainPhones[0].replace(/-/g, "")}`, "btn btn-secondary", false, "click_call"],
    [`โทรหา MOSSA ${contact.mainPhones[1]}`, `tel:${contact.mainPhones[1].replace(/-/g, "")}`, "btn btn-secondary", false, "click_call"],
    ["โทรจองสนาม", `tel:${contact.fieldBookingPhone.replace(/-/g, "")}`, "btn btn-ghost", false, "click_call"],
    ["Inbox Facebook", contact.facebookInboxUrl, "btn btn-ghost", true, ""],
    ["Instagram", contact.instagramUrl || `https://www.instagram.com/${instagramHandle}/`, "btn btn-ghost", true, ""],
    ["TikTok", contact.tiktokUrl || `https://www.tiktok.com/${tiktokHandle}`, "btn btn-ghost", true, ""]
  ];

  if (contact.googleMapsUrl) {
    buttons.push(["นำทางด้วย Google Maps", contact.googleMapsUrl, "btn btn-ghost", true, ""]);
  }

  buttons.forEach(([label, href, className, external, eventName]) => {
    const link = createEl("a", className, label);
    link.href = href;
    if (eventName) {
      link.dataset.track = eventName;
      link.dataset.trackLocation = "contact";
    }
    if (external) {
      link.target = "_blank";
      link.rel = "noreferrer";
    }
    actions.append(link);
  });
}

function renderFaq(faq) {
  const list = qs("#faq-list");
  if (!list) return;
  list.innerHTML = "";

  const items = LANDING_FAQ.length ? LANDING_FAQ : faq;
  items.forEach((item) => {
    const card = createEl("article", "faq-item");
    card.append(createEl("h3", "", item.questionTh));
    card.append(createEl("p", "", item.answerTh));
    list.append(card);
  });
}

function initLeadForm(contact) {
  const form = qs("#lead-form");
  const message = qs("#lead-message");
  if (!form || !message) return;

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const data = new FormData(form);
    const lead = {
      name: String(data.get("name") || "").trim(),
      phone: String(data.get("phone") || "").trim(),
      service: String(data.get("service") || "").trim()
    };

    const leadText = [
      "สวัสดีครับ/ค่ะ ทีม MOSSA",
      "สนใจให้แนะนำบริการหรือแพ็กเกจ",
      lead.name ? `ชื่อ: ${lead.name}` : "",
      lead.phone ? `เบอร์โทร: ${lead.phone}` : "",
      lead.service ? `บริการที่สนใจ: ${lead.service}` : "",
      "ต้องการให้ทีม MOSSA ติดต่อกลับเพื่อแนะนำรายละเอียด"
    ].filter(Boolean).join("\n");

    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(leadText).catch(() => {});
    }

    trackConversion("submit_lead_form", {
      service: lead.service
    });

    message.textContent = "ส่งข้อมูลเรียบร้อย ทีม MOSSA จะติดต่อกลับโดยเร็ว หาก LINE ไม่เปิด กรุณากดปุ่ม LINE หรือโทรหา MOSSA";
    message.classList.add("is-success");

    const lineUrl = contact?.lineUrl || "";
    if (lineUrl) window.open(lineUrl, "_blank", "noreferrer");
    form.reset();
  });
}

async function init() {
  initThemeToggle();
  initMenu();
  initServiceModalEvents();
  try {
    state.data = await loadData();
    initContactLinks(state.data.contact);
    initServiceShortcuts(state.data.pricing);
    initLeadForm(state.data.contact);
    renderAbout(state.data.about);
    renderServices(state.data.services, state.data.pricing);
    renderFacilities(state.data.facilities);
    renderExperts(state.data.experts, state.data.trainers);
    renderMembershipPlans(state.data.pricing);
    renderPricingTabs(state.data.pricing);
    renderPricing(state.data.pricing);
    renderClassHighlights();
    renderTrial(state.data.trial);
    renderHours(state.data.hours);
    renderClassFilters();
    renderClasses(state.data.schedule);
    renderCorporate(state.data.corporates);
    renderPromotions(state.data.promotions);
    renderGallery(state.data.gallery);
    renderContact(state.data.contact);
    renderFaq(state.data.faq);
    initConversionTracking();
  } catch (error) {
    const main = qs("main");
    const message = createEl("div", "section data-error", `โหลดข้อมูลไม่สำเร็จ: ${error.message}`);
    main.prepend(message);
  }
}

init();
