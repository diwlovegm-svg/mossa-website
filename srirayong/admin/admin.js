import { approveCoupon, checkCoupon, listPendingCoupons, redeemCoupon } from '../shared/apiClient.js';
import { getStatusPresentation } from '../shared/campaignConfig.js';
import { mountInstallButton, registerPwa, renderRuntimeStatus } from '../shared/pwa.js';

const form = document.querySelector('#checkForm');
const codeInput = document.querySelector('#couponCode');
const checkButton = document.querySelector('#checkButton');
const notice = document.querySelector('#adminNotice');
const pendingNotice = document.querySelector('#pendingNotice');
const pendingList = document.querySelector('#pendingList');
const refreshPendingButton = document.querySelector('#refreshPending');
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
loadPendingApprovals();
window.setInterval(loadPendingApprovals, 7000);

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  await runCheck();
});

redeemButton.addEventListener('click', async () => {
  clearNotice();
  setButtonLoading(redeemButton, true, 'กำลังยืนยัน...');
  try {
    const response = await redeemCoupon({ couponCode: currentCode });
    const redeemedNow = response.redeemedNow === true || response.message === 'ยืนยันใช้สิทธิ์เรียบร้อยแล้ว';
    renderResult(response, { redeemedNow });
    showNotice(
      redeemedNow ? 'ใช้สิทธิ์แล้วเรียบร้อย' : response.message || 'ไม่สามารถยืนยันใช้สิทธิ์ได้',
      redeemedNow ? 'success' : 'warning',
    );
  } catch (error) {
    showNotice(error.message || 'ไม่สามารถยืนยันใช้สิทธิ์ได้', 'error');
  } finally {
    setButtonLoading(redeemButton, false, 'ยืนยันใช้สิทธิ์');
  }
});

refreshPendingButton.addEventListener('click', async () => {
  await loadPendingApprovals();
});

pendingList.addEventListener('click', async (event) => {
  const button = event.target.closest('[data-approve-code]');
  if (!button) return;

  const couponCode = button.dataset.approveCode;
  setButtonLoading(button, true, 'กำลังอนุมัติ...');
  showPendingNotice('กำลังอนุมัติคำขอ...', 'info');
  try {
    const response = await approveCoupon({ couponCode });
    showPendingNotice(response.message || 'อนุมัติคูปองแล้ว', 'success');
    await loadPendingApprovals();
  } catch (error) {
    showPendingNotice(error.message || 'อนุมัติคำขอไม่สำเร็จ', 'error');
  } finally {
    setButtonLoading(button, false, 'อนุมัติให้รับคูปอง');
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

async function loadPendingApprovals() {
  setButtonLoading(refreshPendingButton, true, 'กำลังโหลด...');
  try {
    const response = await listPendingCoupons();
    renderPendingApprovals(response.coupons || []);
    showPendingNotice(response.coupons?.length ? `มีคำขอรออนุมัติ ${response.coupons.length} รายการ` : 'ยังไม่มีคำขอรออนุมัติ', response.coupons?.length ? 'info' : 'success');
  } catch (error) {
    renderPendingApprovals([]);
    showPendingNotice(error.message || 'โหลดคำขอรออนุมัติไม่สำเร็จ', 'error');
  } finally {
    setButtonLoading(refreshPendingButton, false, 'รีเฟรช');
  }
}

function renderPendingApprovals(coupons) {
  if (!coupons.length) {
    pendingList.innerHTML = '<p class="empty-state">ยังไม่มีลูกค้ารออนุมัติ</p>';
    return;
  }

  pendingList.innerHTML = coupons.map((coupon) => `
    <article class="pending-item">
      <div>
        <strong>${escapeHtml(coupon.customerName || '-')}</strong>
        <span>${escapeHtml(coupon.customerPhone || '-')}</span>
      </div>
      <dl>
        <div>
          <dt>รหัส</dt>
          <dd>${escapeHtml(coupon.code || '-')}</dd>
        </div>
        <div>
          <dt>ส่งคำขอเมื่อ</dt>
          <dd>${escapeHtml(formatDateTime(coupon.issuedAt))}</dd>
        </div>
      </dl>
      <button class="primary-button" type="button" data-approve-code="${escapeHtml(coupon.code)}">อนุมัติให้รับคูปอง</button>
    </article>
  `).join('');
}

function renderResult(response, options = {}) {
  const status = response.status || response.coupon?.status || 'NOT_FOUND';
  const presentation = options.redeemedNow
    ? { label: 'ใช้สิทธิ์แล้ว', message: 'ใช้สิทธิ์แล้วเรียบร้อย', type: 'success' }
    : getStatusPresentation(status);

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

function showPendingNotice(message, type) {
  pendingNotice.textContent = message;
  pendingNotice.dataset.type = type;
}

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}
