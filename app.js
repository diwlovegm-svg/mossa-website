const DATA_FILES = {
  contact: "data/contact.json",
  services: "data/services.json",
  pricing: "data/pricing.json",
  hours: "data/hours.json",
  schedule: "data/class-schedule.json",
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

const qs = (selector, root = document) => root.querySelector(selector);
const qsa = (selector, root = document) => [...root.querySelectorAll(selector)];

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

function initContactLinks(contact) {
  qsa("[data-line-link]").forEach((link) => {
    link.href = contact.lineUrl;
  });
  qsa("[data-main-phone]").forEach((link) => {
    link.href = `tel:${contact.mainPhones[0].replace(/-/g, "")}`;
  });
}

function renderServices(services, pricing) {
  const grid = qs("#service-grid");
  grid.innerHTML = "";

  const activeServices = services
    .filter((service) => service.status === "active")
    .sort((a, b) => a.sortOrder - b.sortOrder);

  activeServices.forEach((service) => {
      const card = createEl("button", `service-card ${service.id === state.selectedServiceId ? "is-selected" : ""}`);
      card.type = "button";
      card.dataset.serviceId = service.id;
      card.setAttribute("aria-pressed", String(service.id === state.selectedServiceId));
      const image = createEl("div", "service-image");
      image.style.backgroundImage = `linear-gradient(180deg, rgba(9, 9, 13, 0.16), rgba(9, 9, 13, 0.72)), url("${service.imageUrl}")`;

      const body = createEl("div", "service-card-body");
      body.append(createEl("p", "eyebrow", service.categoryLabel));
      body.append(createEl("h3", "", service.nameTh));
      body.append(createEl("p", "", service.shortDescriptionTh));

      const meta = createEl("div", "service-meta");
      service.tags.forEach((tag, index) => {
        meta.append(createEl("span", `tag ${index % 2 ? "orange" : ""}`, tag));
      });
      body.append(meta);
      body.append(createEl("span", "detail-link", "ดูรายละเอียดและราคา"));
      card.append(image, body);
      card.addEventListener("click", () => {
        state.selectedServiceId = service.id;
        renderServices(services, pricing);
        renderServiceDetail(service, pricing);
        qs("#service-detail")?.scrollIntoView({ behavior: "smooth", block: "start" });
      });
      grid.append(card);
    });

  const selected = activeServices.find((service) => service.id === state.selectedServiceId);
  if (selected) {
    renderServiceDetail(selected, pricing);
  } else {
    const detail = qs("#service-detail");
    if (detail) detail.innerHTML = "";
  }
}

function createPriceCard(item, categoryName) {
  const card = createEl("article", "price-card");
  card.append(createEl("p", "eyebrow", item.groupLabel || categoryName));
  card.append(createEl("h3", "", item.nameTh));

  if (item.rows?.length) {
    const table = createEl("table", "price-table");
    const thead = document.createElement("thead");
    const headRow = document.createElement("tr");
    item.columns.forEach((column) => headRow.append(createEl("th", "", column)));
    thead.append(headRow);
    const tbody = document.createElement("tbody");
    item.rows.forEach((row) => {
      const tr = document.createElement("tr");
      row.forEach((cell) => tr.append(createEl("td", "", cell)));
      tbody.append(tr);
    });
    table.append(thead, tbody);
    card.append(table);
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

function renderServiceDetail(service, pricing) {
  const detail = qs("#service-detail");
  if (!detail) return;
  detail.innerHTML = "";

  const shell = createEl("article", "service-detail-card");
  const backButton = createEl("button", "service-back-button", "← ย้อนกลับไปเลือกบริการ");
  backButton.type = "button";
  backButton.addEventListener("click", () => {
    state.selectedServiceId = "";
    renderServices(state.data.services, state.data.pricing);
    qs("#services")?.scrollIntoView({ behavior: "smooth", block: "start" });
  });
  shell.append(backButton);

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
  const priceLink = createEl("a", "btn btn-primary", "ดูราคาเต็ม");
  priceLink.href = "#pricing";
  priceLink.addEventListener("click", () => {
    const firstItemId = service.priceItemIds?.[0];
    const firstItem = pricing.items.find((item) => item.id === firstItemId);
    if (firstItem) {
      state.pricingCategory = firstItem.categoryId;
      renderPricingTabs(pricing);
      renderPricing(pricing);
    }
  });
  const contactLink = createEl("a", "btn btn-ghost", service.id === "court-field" ? "โทรจองสนาม" : "สอบถามเพิ่มเติม");
  const isFieldBooking = service.id === "badminton-court" || service.id === "football-field";
  contactLink.textContent = isFieldBooking ? "โทรจองสนาม" : "สอบถามเพิ่มเติม";
  contactLink.href = isFieldBooking ? "tel:0944061555" : state.data.contact.lineUrl;
  if (!isFieldBooking) {
    contactLink.target = "_blank";
    contactLink.rel = "noreferrer";
  }
  actionRow.append(priceLink, contactLink);
  if (service.registrationLabel) {
    const registrationLink = createEl("a", service.registrationUrl ? "btn btn-secondary" : "btn btn-disabled", service.registrationUrl ? service.registrationLabel : `${service.registrationLabel} (รอลิงก์)`);
    registrationLink.href = service.registrationUrl || "#contact";
    if (service.registrationUrl) {
      registrationLink.target = "_blank";
      registrationLink.rel = "noreferrer";
    }
    actionRow.append(registrationLink);
  }
  intro.append(actionRow);
  shell.append(intro);

  const priceWrap = createEl("div", "service-detail-prices");
  const itemIds = service.priceItemIds || [];
  const categoryIds = service.priceCategoryIds || [];
  const servicePriceItems = itemIds.length
    ? pricing.items.filter((item) => itemIds.includes(item.id))
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
      priceWrap.append(createPriceCard(item, category?.nameTh || service.categoryLabel));
    });
  } else {
    priceWrap.append(createEl("div", "empty-state", "บริการนี้ดูรายละเอียดหลักจากตารางคลาสและช่องทางติดต่อ MOSSA"));
  }

  shell.append(priceWrap);
  detail.append(shell);
}

function renderPricingTabs(pricing) {
  const tabs = qs("#pricing-tabs");
  tabs.innerHTML = "";

  pricing.categories.forEach((category) => {
    const button = createEl("button", category.id === state.pricingCategory ? "is-active" : "", category.nameTh);
    button.type = "button";
    button.addEventListener("click", () => {
      state.pricingCategory = category.id;
      renderPricingTabs(pricing);
      renderPricing(pricing);
    });
    tabs.append(button);
  });
}

function renderPricing(pricing) {
  const grid = qs("#pricing-content");
  const category = pricing.categories.find((item) => item.id === state.pricingCategory);
  const items = pricing.items.filter((item) => item.categoryId === state.pricingCategory);
  grid.innerHTML = "";

  if (category?.notice) {
    const notice = createEl("div", "empty-state", category.notice);
    notice.style.gridColumn = "1 / -1";
    grid.append(notice);
  }

  items.forEach((item) => {
    grid.append(createPriceCard(item, category.nameTh));
  });
}

function renderTrial(trial) {
  qs("#trial-title").textContent = trial.titleTh;
  qs("#trial-eligibility").textContent = trial.eligibilityTh;

  const steps = qs("#trial-steps");
  steps.innerHTML = "";
  trial.items.forEach((item) => {
    const step = createEl("div", "trial-step");
    step.append(createEl("strong", "", item.title));
    step.append(createEl("span", "", item.body));
    steps.append(step);
  });
}

function renderHours(hours) {
  const grid = qs("#hours-grid");
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
    caption.append(downloadLink);
  }

  figure.append(caption);
  list.append(figure);
}

function renderCorporate(corporates) {
  const input = qs("#corporate-query");
  const results = qs("#corporate-results");

  const draw = () => {
    const query = input.value.trim().toLowerCase();
    const matches = corporates.filter((company) => {
      const keywords = [company.companyNameTh, company.companyNameEn, ...(company.searchKeywords || [])].join(" ").toLowerCase();
      return !query || keywords.includes(query);
    });
    results.innerHTML = "";

    if (!matches.length) {
      results.append(createEl("div", "empty-state", "ไม่พบบริษัทในตัวอย่าง Prototype กรุณาแอด LINE เพื่อตรวจสอบสิทธิ์"));
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

function renderPromotions(promotions) {
  const grid = qs("#promotion-grid");
  grid.innerHTML = "";

  promotions.forEach((promotion) => {
    const card = createEl("article", "promotion-card");
    card.append(createEl("p", "eyebrow", promotion.label));
    card.append(createEl("h3", "", promotion.titleTh));
    card.append(createEl("p", "", promotion.descriptionTh));
    card.append(createEl("span", "status-pill", promotion.statusText));
    grid.append(card);
  });
}

function renderGallery(gallery) {
  const grid = qs("#gallery-grid");
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
  qs("#contact-address").textContent = contact.addressTh;
  qs("#map-status").textContent = contact.googleMapsUrl
    ? "เปิดปุ่มนำทางด้วย Google Maps แล้ว"
    : "รอลิงก์ Google Maps ที่ยืนยันแล้ว จึงยังไม่แสดงปุ่มนำทางจริง";

  const actions = qs("#contact-actions");
  actions.innerHTML = "";

  const buttons = [
    ["แอด LINE", contact.lineUrl, "btn btn-primary", true],
    ["โทรหลัก", `tel:${contact.mainPhones[0].replace(/-/g, "")}`, "btn btn-secondary", false],
    ["โทรจองสนาม", `tel:${contact.fieldBookingPhone.replace(/-/g, "")}`, "btn btn-ghost", false],
    ["Inbox Facebook", contact.facebookInboxUrl, "btn btn-ghost", true]
  ];

  if (contact.googleMapsUrl) {
    buttons.push(["นำทางด้วย Google Maps", contact.googleMapsUrl, "btn btn-ghost", true]);
  }

  buttons.forEach(([label, href, className, external]) => {
    const link = createEl("a", className, label);
    link.href = href;
    if (external) {
      link.target = "_blank";
      link.rel = "noreferrer";
    }
    actions.append(link);
  });
}

function renderFaq(faq) {
  const list = qs("#faq-list");
  list.innerHTML = "";

  faq.forEach((item) => {
    const card = createEl("article", "faq-item");
    card.append(createEl("h3", "", item.questionTh));
    card.append(createEl("p", "", item.answerTh));
    list.append(card);
  });
}

async function init() {
  initMenu();
  try {
    state.data = await loadData();
    initContactLinks(state.data.contact);
    renderServices(state.data.services, state.data.pricing);
    renderPricingTabs(state.data.pricing);
    renderPricing(state.data.pricing);
    renderTrial(state.data.trial);
    renderHours(state.data.hours);
    renderClassFilters();
    renderClasses(state.data.schedule);
    renderCorporate(state.data.corporates);
    renderPromotions(state.data.promotions);
    renderGallery(state.data.gallery);
    renderContact(state.data.contact);
    renderFaq(state.data.faq);
  } catch (error) {
    const main = qs("main");
    const message = createEl("div", "section data-error", `โหลดข้อมูลไม่สำเร็จ: ${error.message}`);
    main.prepend(message);
  }
}

init();
