import { checkCoupon, redeemCoupon } from '../shared/apiClient.js';
import { getStatusPresentation } from '../shared/campaignConfig.js';
import { mountInstallButton, registerPwa, renderRuntimeStatus } from '../shared/pwa.js';

const form = document.querySelector('#checkForm');
const codeInput = document.querySelector('#couponCode');
const checkButton = document.querySelector('#checkButton');
const notice = document.querySelector('#adminNotice');
const resultPanel = document.querySelector('#resultPanel');
const statusBadge = document.querySelector('#statusBadge');
const statusMessage = document.querySelector('#statusMessage');
const detailsList = document.querySelector('#couponDetails');
const redeemButton = document.querySelector('#redeemButton');
const installButton = document.querySelector('#installApp');
const runtimeStatus = document.querySelector('#runtimeStatus');

let currentCode = '';

registerPwa();
mountInstallButton(installButton);
renderRuntimeStatus(runtimeStatus);

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  await runCheck();
});

redeemButton.addEventListener('click', async () => {
  clearNotice();
  setButtonLoading(redeemButton, true, 'กำลังยืนยัน...');
  try {
    const response = await redeemCoupon({ couponCode: currentCode });
    renderResult(response);
    showNotice(response.message || 'เปลี่ยนสถานะเป็น REDEEMED แล้ว', 'success');
  } catch (error) {
    showNotice(error.message || 'ไม่สามารถยืนยันใช้สิทธิ์ได้', 'error');
  } finally {
    setButtonLoading(redeemButton, false, 'ยืนยันใช้สิทธิ์');
  }
});

async function runCheck() {
  clearNotice();
  currentCode = codeInput.value.trim().toUpperCase();

  if (!currentCode) {
    showNotice('กรุณากรอกรหัสคูปอง', 'error');
    return;
  }

  setButtonLoading(checkButton, true, 'กำลังตรวจสอบ...');
  showNotice('กำลังตรวจสอบคูปอง...', 'info');
  try {
    const response = await checkCoupon({ couponCode: currentCode });
    renderResult(response);
    showNotice('ตรวจสอบคูปองเรียบร้อยแล้ว', 'success');
  } catch (error) {
    showNotice(error.message || 'ตรวจสอบคูปองไม่สำเร็จ', 'error');
  } finally {
    setButtonLoading(checkButton, false, 'ตรวจสอบ');
    codeInput.select();
  }
}

function renderResult(response) {
  const status = response.status || response.coupon?.status || 'NOT_FOUND';
  const presentation = getStatusPresentation(status);

  resultPanel.hidden = false;
  statusBadge.textContent = presentation.label;
  statusBadge.dataset.status = presentation.type;
  statusMessage.textContent = presentation.message;
  redeemButton.hidden = status !== 'ISSUED';

  const details = buildDetails(response.coupon, status);
  detailsList.innerHTML = details.map(([label, value]) => `
    <div>
      <dt>${escapeHtml(label)}</dt>
      <dd>${escapeHtml(value || '-')}</dd>
    </div>
  `).join('');

  resultPanel.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function buildDetails(coupon, status) {
  if (!coupon) {
    return [
      ['รหัส', currentCode],
      ['สถานะ', status],
    ];
  }

  return [
    ['รหัส', coupon.code],
    ['สถานะฐานข้อมูล', coupon.status],
    ['สถานะที่ใช้งานจริง', status],
    ['ชื่อลูกค้า', coupon.customerName],
    ['เบอร์โทร', coupon.customerPhone],
    ['ออกคูปองเมื่อ', formatDateTime(coupon.issuedAt)],
    ['หมดอายุ', formatDateTime(coupon.expiresAt)],
    ['ใช้สิทธิ์เมื่อ', formatDateTime(coupon.redeemedAt)],
  ];
}

function formatDateTime(value) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat('th-TH', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'Asia/Bangkok',
  }).format(date);
}

function setButtonLoading(button, isLoading, label) {
  button.disabled = isLoading;
  button.textContent = label;
}

function showNotice(message, type) {
  notice.textContent = message;
  notice.dataset.type = type;
}

function clearNotice() {
  notice.textContent = '';
  notice.removeAttribute('data-type');
}

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}
