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

function initServiceModalEvents() {
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && qs("#service-detail")?.classList.contains("is-open")) {
      closeServiceDetail();
    }
  });
}

function renderServices(services, pricing) {
  const grid = qs("#service-grid");
  grid.innerHTML = "";

  const activeServices = services
    .filter((service) => service.status === "active" && !service.parentServiceId)
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
      body.append(createEl("span", "detail-link", "เปิดรายละเอียด / ราคา"));
      card.append(image, body);
      card.addEventListener("click", () => {
        state.selectedServiceId = service.id;
        renderServiceDetail(service, pricing);
      });
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

function createPriceCard(item, categoryName) {
  const card = createEl("article", "price-card");
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
  section.append(createEl("p", "eyebrow", "Included Services"));
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
    section.append(createEl("p", "eyebrow", "Class Meaning"));
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
    section.append(createEl("p", "eyebrow", "Trainers"));
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
    const registrationLink = createEl("a", url ? "btn btn-secondary" : "btn btn-disabled", url ? label : `${label} (รอลิงก์)`);
    registrationLink.href = url || "#contact";
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
  intro.append(createEl("p", "eyebrow", about.eyebrow || "About MOSSA"));
  intro.append(createEl("h2", "", about.titleTh || "รู้จัก MOSSA Sport Society"));
  intro.append(createEl("p", "lead-text", about.introTh || ""));

  const factGrid = createEl("div", "fact-grid");
  (about.facts || []).forEach((fact) => {
    const card = createEl("article", "fact-card");
    card.append(createEl("span", "", fact.label));
    card.append(createEl("strong", "", fact.value));
    factGrid.append(card);
  });

  const vision = createEl("div", "vision-panel");
  vision.append(createEl("p", "eyebrow", "Vision"));
  vision.append(createEl("h3", "", "วิสัยทัศน์"));
  vision.append(createEl("p", "", about.visionTh || ""));

  const values = createEl("div", "value-grid");
  (about.values || []).forEach((value) => {
    const item = createEl("article", "value-card");
    item.append(createEl("span", "value-letter", value.letter));
    item.append(createEl("strong", "", value.title));
    item.append(createEl("p", "", value.descriptionTh));
    values.append(item);
  });

  vision.append(values);
  root.append(intro, factGrid, vision);
}

function renderFacilities(facilities) {
  const root = qs("#facilities-content");
  if (!root || !facilities) return;
  root.innerHTML = "";

  (facilities.sections || []).forEach((section) => {
    const card = createEl("article", "facility-card");
    card.append(createEl("p", "eyebrow", facilities.eyebrow || "Facilities"));
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
  summary.append(createEl("p", "eyebrow", experts.eyebrow || "Our Experts"));
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
  const instagramHandle = String(contact.instagram || "").replace(/^@/, "");
  const tiktokHandle = String(contact.tiktok || "").startsWith("@") ? contact.tiktok : `@${contact.tiktok}`;

  const buttons = [
    ["แอด LINE", contact.lineUrl, "btn btn-primary", true],
    [`โทร ${contact.mainPhones[0]}`, `tel:${contact.mainPhones[0].replace(/-/g, "")}`, "btn btn-secondary", false],
    [`โทร ${contact.mainPhones[1]}`, `tel:${contact.mainPhones[1].replace(/-/g, "")}`, "btn btn-secondary", false],
    ["โทรจองสนาม", `tel:${contact.fieldBookingPhone.replace(/-/g, "")}`, "btn btn-ghost", false],
    ["Inbox Facebook", contact.facebookInboxUrl, "btn btn-ghost", true],
    ["Instagram", contact.instagramUrl || `https://www.instagram.com/${instagramHandle}/`, "btn btn-ghost", true],
    ["TikTok", contact.tiktokUrl || `https://www.tiktok.com/${tiktokHandle}`, "btn btn-ghost", true]
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
  initServiceModalEvents();
  try {
    state.data = await loadData();
    initContactLinks(state.data.contact);
    renderAbout(state.data.about);
    renderServices(state.data.services, state.data.pricing);
    renderFacilities(state.data.facilities);
    renderExperts(state.data.experts, state.data.trainers);
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
