import { getCampaignConfig, getCouponTemplate } from './runtimeConfig.js';

const code39Patterns = {
  '0': 'nnnwwnwnn',
  '1': 'wnnwnnnnw',
  '2': 'nnwwnnnnw',
  '3': 'wnwwnnnnn',
  '4': 'nnnwwnnnw',
  '5': 'wnnwwnnnn',
  '6': 'nnwwwnnnn',
  '7': 'nnnwnnwnw',
  '8': 'wnnwnnwnn',
  '9': 'nnwwnnwnn',
  A: 'wnnnnwnnw',
  B: 'nnwnnwnnw',
  C: 'wnwnnwnnn',
  D: 'nnnnwwnnw',
  E: 'wnnnwwnnn',
  F: 'nnwnwwnnn',
  G: 'nnnnnwwnw',
  H: 'wnnnnwwnn',
  I: 'nnwnnwwnn',
  J: 'nnnnwwwnn',
  K: 'wnnnnnnww',
  L: 'nnwnnnnww',
  M: 'wnwnnnnwn',
  N: 'nnnnwnnww',
  O: 'wnnnwnnwn',
  P: 'nnwnwnnwn',
  Q: 'nnnnnnwww',
  R: 'wnnnnnwwn',
  S: 'nnwnnnwwn',
  T: 'nnnnwnwwn',
  U: 'wwnnnnnnw',
  V: 'nwwnnnnnw',
  W: 'wwwnnnnnn',
  X: 'nwnnwnnnw',
  Y: 'wwnnwnnnn',
  Z: 'nwwnwnnnn',
  '-': 'nwnnnnwnw',
  '.': 'wwnnnnwnn',
  ' ': 'nwwnnnwnn',
  '$': 'nwnwnwnnn',
  '/': 'nwnwnnnwn',
  '+': 'nwnnnwnwn',
  '%': 'nnnwnwnwn',
  '*': 'nwnnwnwnn',
};

export function renderCoupon(container, coupon) {
  container.innerHTML = '';
  const campaignConfig = getCampaignConfig();
  const couponTemplate = getCouponTemplate();

  const article = document.createElement('article');
  article.className = 'coupon-card';
  article.style.setProperty('--coupon-primary', couponTemplate.primaryColor);
  article.style.setProperty('--coupon-accent', couponTemplate.accentColor);
  article.style.setProperty('--coupon-bg', couponTemplate.backgroundColor);
  article.style.setProperty('--coupon-text', couponTemplate.textColor);

  article.innerHTML = `
    <div class="coupon-topline">
      ${renderLogoMarkup()}
      <span>${escapeHtml(couponTemplate.badgeText)}</span>
    </div>
    <div class="coupon-body">
      <p class="coupon-campaign">${escapeHtml(couponTemplate.campaignName)} · ${escapeHtml(couponTemplate.branchLabel)}</p>
      <h3>${escapeHtml(couponTemplate.title)}</h3>
      <p>${escapeHtml(couponTemplate.subtitle)}</p>
      <p class="coupon-description">${escapeHtml(couponTemplate.bodyText)}</p>
    </div>
    <div class="coupon-meta">
      <div>
        <span>${escapeHtml(couponTemplate.expiresLabel)}</span>
        <strong>${escapeHtml(campaignConfig.couponValidity.displayText)}</strong>
      </div>
      <div>
        <span>ชื่อผู้รับ</span>
        <strong>${escapeHtml(coupon.customerName)}</strong>
      </div>
    </div>
    <div class="coupon-code-block">
      <span>Coupon Code</span>
      <strong>${escapeHtml(coupon.code)}</strong>
      <div class="barcode-host"></div>
      ${couponTemplate.showQrCode ? renderQrMarkup(coupon.code) : ''}
    </div>
    <ul class="coupon-terms">
      ${couponTemplate.terms.map((term) => `<li>${escapeHtml(term)}</li>`).join('')}
    </ul>
  `;

  container.append(article);

  const barcodeHost = article.querySelector('.barcode-host');
  if (couponTemplate.showBarcode) {
    barcodeHost.append(createBarcodeSvg(coupon.code));
  } else {
    barcodeHost.remove();
  }
}

export function downloadCouponImage(coupon) {
  const canvas = document.createElement('canvas');
  const width = 1080;
  const height = 1500;
  const scale = window.devicePixelRatio || 1;
  canvas.width = width * scale;
  canvas.height = height * scale;
  canvas.style.width = `${width}px`;
  canvas.style.height = `${height}px`;

  const context = canvas.getContext('2d');
  context.scale(scale, scale);
  drawCouponToCanvas(context, coupon, width, height);

  canvas.toBlob((blob) => {
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${coupon.code}.png`;
    document.body.append(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }, 'image/png');
}

export function createBarcodeSvg(code, options = {}) {
  const bars = buildCode39Bars(code);
  const narrow = options.narrow ?? 2;
  const wide = options.wide ?? 5;
  const height = options.height ?? 70;
  const quietZone = options.quietZone ?? 16;
  const totalWidth = bars.reduce((sum, bar) => sum + (bar.width === 'w' ? wide : narrow), quietZone * 2);
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('viewBox', `0 0 ${totalWidth} ${height}`);
  svg.setAttribute('role', 'img');
  svg.setAttribute('aria-label', `Barcode ${code}`);
  svg.classList.add('barcode-svg');

  let x = quietZone;
  for (const bar of bars) {
    const segmentWidth = bar.width === 'w' ? wide : narrow;
    if (bar.isBar) {
      const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      rect.setAttribute('x', x);
      rect.setAttribute('y', 0);
      rect.setAttribute('width', segmentWidth);
      rect.setAttribute('height', height);
      svg.append(rect);
    }
    x += segmentWidth;
  }

  return svg;
}

function drawCouponToCanvas(context, coupon, width, height) {
  const campaignConfig = getCampaignConfig();
  const couponTemplate = getCouponTemplate();
  const primary = couponTemplate.primaryColor;
  const accent = couponTemplate.accentColor;
  const background = couponTemplate.backgroundColor;
  const text = couponTemplate.textColor;

  roundedRect(context, 0, 0, width, height, 48, background);
  roundedRect(context, 48, 48, width - 96, height - 96, 36, '#ffffff');

  context.fillStyle = primary;
  context.fillRect(48, 48, width - 96, 220);
  context.fillStyle = accent;
  context.fillRect(48, 250, width - 96, 18);

  context.fillStyle = '#ffffff';
  context.font = '700 72px Arial, sans-serif';
  context.fillText(couponTemplate.logoText, 88, 150);
  context.font = '700 38px Arial, sans-serif';
  context.fillText(couponTemplate.badgeText, 88, 214);

  context.fillStyle = text;
  context.font = '500 36px Arial, sans-serif';
  context.fillText(`${couponTemplate.campaignName} · ${couponTemplate.branchLabel}`, 88, 356);
  context.font = '700 76px Arial, sans-serif';
  drawWrappedText(context, couponTemplate.title, 88, 452, width - 176, 88);
  context.font = '500 42px Arial, sans-serif';
  drawWrappedText(context, couponTemplate.subtitle, 88, 610, width - 176, 58);
  context.font = '400 34px Arial, sans-serif';
  drawWrappedText(context, couponTemplate.bodyText, 88, 730, width - 176, 50);

  roundedRect(context, 88, 870, width - 176, 160, 24, '#f1f5f9');
  drawMetaBlock(context, couponTemplate.expiresLabel, campaignConfig.couponValidity.displayText, 124, 940);
  drawMetaBlock(context, 'ชื่อผู้รับ', coupon.customerName, 560, 940);

  context.fillStyle = '#64748b';
  context.font = '500 30px Arial, sans-serif';
  context.fillText('Coupon Code', 88, 1118);
  context.fillStyle = text;
  context.font = '700 58px Consolas, monospace';
  context.fillText(coupon.code, 88, 1192);

  if (couponTemplate.showBarcode) {
    drawBarcodeOnCanvas(context, coupon.code, 88, 1240, width - 176, 100);
  }

  context.fillStyle = text;
  context.font = '400 28px Arial, sans-serif';
  let y = 1400;
  for (const term of couponTemplate.terms.slice(0, 3)) {
    context.fillText(`• ${term}`, 88, y);
    y += 38;
  }
}

function drawMetaBlock(context, label, value, x, y) {
  const couponTemplate = getCouponTemplate();
  context.fillStyle = '#64748b';
  context.font = '500 28px Arial, sans-serif';
  context.fillText(label, x, y - 32);
  context.fillStyle = couponTemplate.textColor;
  context.font = '700 40px Arial, sans-serif';
  context.fillText(value, x, y + 16);
}

function drawBarcodeOnCanvas(context, code, x, y, maxWidth, height) {
  const bars = buildCode39Bars(code);
  const narrow = 3;
  const wide = 7;
  const rawWidth = bars.reduce((sum, bar) => sum + (bar.width === 'w' ? wide : narrow), 0);
  const scale = Math.min(1, maxWidth / rawWidth);
  let cursor = x + (maxWidth - rawWidth * scale) / 2;

  context.fillStyle = '#0f172a';
  for (const bar of bars) {
    const segmentWidth = (bar.width === 'w' ? wide : narrow) * scale;
    if (bar.isBar) {
      context.fillRect(cursor, y, segmentWidth, height);
    }
    cursor += segmentWidth;
  }
}

function buildCode39Bars(code) {
  const encoded = `*${code.toUpperCase()}*`;
  const bars = [];

  for (const char of encoded) {
    const pattern = code39Patterns[char];
    if (!pattern) continue;
    [...pattern].forEach((width, index) => {
      bars.push({ width, isBar: index % 2 === 0 });
    });
    bars.push({ width: 'n', isBar: false });
  }

  return bars;
}

function renderLogoMarkup() {
  const couponTemplate = getCouponTemplate();
  if (couponTemplate.logoUrl) {
    return `<img class="coupon-logo" src="${escapeHtml(couponTemplate.logoUrl)}" alt="${escapeHtml(couponTemplate.logoText)}">`;
  }

  return `<strong class="coupon-logo-text">${escapeHtml(couponTemplate.logoText)}</strong>`;
}

function renderQrMarkup(code) {
  const encoded = encodeURIComponent(code);
  return `
    <img
      class="coupon-qr"
      src="https://quickchart.io/qr?text=${encoded}&size=120&margin=1"
      alt="QR Code ${escapeHtml(code)}"
    >
  `;
}

function roundedRect(context, x, y, width, height, radius, fillStyle) {
  context.beginPath();
  context.moveTo(x + radius, y);
  context.arcTo(x + width, y, x + width, y + height, radius);
  context.arcTo(x + width, y + height, x, y + height, radius);
  context.arcTo(x, y + height, x, y, radius);
  context.arcTo(x, y, x + width, y, radius);
  context.closePath();
  context.fillStyle = fillStyle;
  context.fill();
}

function drawWrappedText(context, text, x, y, maxWidth, lineHeight) {
  const words = String(text).split(' ');
  let line = '';
  let cursorY = y;

  for (const word of words) {
    const testLine = line ? `${line} ${word}` : word;
    if (context.measureText(testLine).width > maxWidth && line) {
      context.fillText(line, x, cursorY);
      line = word;
      cursorY += lineHeight;
    } else {
      line = testLine;
    }
  }

  if (line) {
    context.fillText(line, x, cursorY);
  }
}

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}
