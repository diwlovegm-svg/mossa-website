import { claimCoupon, consumeApiRelayResponse, fetchCouponSettings, getClaimStatus } from '../shared/apiClient.js';
import { downloadCouponImage, renderCoupon } from '../shared/couponRenderer.js';
import { mountInstallButton, registerPwa, renderRuntimeStatus } from '../shared/pwa.js';

const form = document.querySelector('#claimForm');
const nameInput = document.querySelector('#customerName');
const phoneInput = document.querySelector('#customerPhone');
const claimButton = document.querySelector('#claimButton');
const notice = document.querySelector('#claimNotice');
const pendingSection = document.querySelector('#pendingSection');
const pendingStatus = document.querySelector('#pendingStatus');
const pendingName = document.querySelector('#pendingName');
const pendingPhone = document.querySelector('#pendingPhone');
const couponSection = document.querySelector('#couponSection');
const couponPreview = document.querySelector('#couponPreview');
const downloadButton = document.querySelector('#downloadCoupon');
const installButton = document.querySelector('#installApp');
const runtimeStatus = document.querySelector('#runtimeStatus');

let currentCoupon = null;
let currentPhone = '';
let approvalPollTimer = null;
let isApprovalPollRunning = false;

registerPwa();
mountInstallButton(installButton);
renderRuntimeStatus(runtimeStatus);
loadLatestSettings();
handleRelayedClaimResponse();

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  clearNotice();

  const customerName = nameInput.value.trim();
  const customerPhone = normalizePhone(phoneInput.value);

  if (!customerName || !customerPhone) {
    showNotice('กรุณากรอกชื่อและเบอร์โทรให้ครบ', 'error');
    return;
  }
  if (!isValidPhone(customerPhone)) {
    showNotice('กรุณากรอกเบอร์โทรให้ครบ 10 หลัก', 'error');
    phoneInput.focus();
    return;
  }

  setLoading(true);
  try {
    try {
      await fetchCouponSettings();
    } catch {
      // The claim request below has a send-only fallback, so config refresh must not block signups.
    }
    const response = await claimCoupon({ customerName, customerPhone });
    assertApprovalBackend(response);
    handleClaimResponse(response, { customerName, customerPhone });
  } catch (error) {
    showNotice(error.message || 'ไม่สามารถออกคูปองได้ กรุณาลองใหม่อีกครั้ง', 'error');
  } finally {
    setLoading(false);
  }
});

downloadButton.addEventListener('click', () => {
  if (!currentCoupon) {
    showNotice('ยังไม่มีคูปองให้บันทึก', 'error');
    return;
  }

  downloadCouponImage(currentCoupon);
});

function setLoading(isLoading) {
  claimButton.disabled = isLoading;
  claimButton.textContent = isLoading ? 'กำลังส่งคำขอ...' : 'ส่งคำขอรับคูปอง';
}

function showNotice(message, type) {
  notice.textContent = message;
  notice.dataset.type = type;
}

function clearNotice() {
  notice.textContent = '';
  notice.removeAttribute('data-type');
}

async function loadLatestSettings() {
  try {
    await fetchCouponSettings();
  } catch {
    // Claim still shows the form; submit will surface setup or connection errors.
  }
}

function handleClaimResponse(response, fallbackCustomer) {
  const coupon = response.coupon;
  const status = response.status || coupon?.effectiveStatus || coupon?.status;

  stopApprovalPolling();

  if (status === 'ISSUED') {
    showApprovedCoupon(coupon, response.message || 'อนุมัติแล้ว บันทึกคูปองไว้ใช้สิทธิ์');
    return;
  }

  if (status === 'PENDING') {
    showPending(coupon || fallbackCustomer, response.message || 'ส่งคำขอรับคูปองแล้ว กรุณารอพนักงานอนุมัติ');
    currentPhone = normalizePhone(coupon?.customerPhone || fallbackCustomer.customerPhone);
    startApprovalPolling();
    return;
  }

  if (status === 'REDEEMED') {
    couponSection.hidden = true;
    pendingSection.hidden = true;
    showNotice(response.message || 'เบอร์นี้ใช้สิทธิ์ไปแล้ว ไม่สามารถรับคูปองซ้ำได้', 'error');
    return;
  }

  if (status === 'EXPIRED' || status === 'VOID') {
    couponSection.hidden = true;
    pendingSection.hidden = true;
    showNotice(response.message || 'เบอร์นี้ไม่สามารถรับคูปองได้', 'error');
    return;
  }

  showNotice(response.message || 'ส่งคำขอไม่สำเร็จ กรุณาติดต่อพนักงาน', 'error');
}

function handleRelayedClaimResponse() {
  const response = consumeApiRelayResponse('claim');
  if (!response) return;

  if (response.ok === false) {
    showNotice(response.message || 'ส่งคำขอไม่สำเร็จ กรุณาลองใหม่อีกครั้ง', 'error');
    return;
  }

  try {
    assertApprovalBackend(response);
    handleClaimResponse(response, response.coupon || {
      customerName: nameInput.value.trim(),
      customerPhone: phoneInput.value,
    });
  } catch (error) {
    showNotice(error.message || 'ส่งคำขอไม่สำเร็จ กรุณาลองใหม่อีกครั้ง', 'error');
  }
}

function showPending(coupon, message) {
  currentCoupon = null;
  couponSection.hidden = true;
  pendingSection.hidden = false;
  pendingName.textContent = coupon.customerName || nameInput.value.trim() || '-';
  pendingPhone.textContent = normalizePhone(coupon.customerPhone || phoneInput.value) || '-';
  pendingStatus.textContent = 'ระบบกำลังรอพนักงานอนุมัติ ถ้าอนุมัติแล้วคูปองจะแสดงขึ้นอัตโนมัติ';
  showNotice(message, 'success');
  pendingSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function showApprovedCoupon(coupon, message) {
  if (!coupon) {
    showNotice('อนุมัติแล้ว แต่ไม่พบข้อมูลคูปอง กรุณาติดต่อพนักงาน', 'error');
    return;
  }

  stopApprovalPolling();
  currentCoupon = coupon;
  pendingSection.hidden = true;
  couponSection.hidden = false;
  renderCoupon(couponPreview, currentCoupon);
  showNotice(message, 'success');
  couponSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function startApprovalPolling() {
  if (!currentPhone) return;
  pollApprovalStatus();
  approvalPollTimer = window.setInterval(pollApprovalStatus, 3000);
}

function assertApprovalBackend(response) {
  if (response?.approvalRequired === true) return;
  throw new Error('ระบบหลังบ้านยังไม่ได้อัปเดตระบบอนุมัติคูปอง กรุณาแจ้งพนักงานให้ deploy Apps Script เวอร์ชันล่าสุดก่อน');
}

function stopApprovalPolling() {
  if (!approvalPollTimer) return;
  window.clearInterval(approvalPollTimer);
  approvalPollTimer = null;
}

async function pollApprovalStatus() {
  if (!currentPhone || isApprovalPollRunning) return;

  isApprovalPollRunning = true;
  try {
    const response = await getClaimStatus({ customerPhone: currentPhone });
    assertApprovalBackend(response);
    const status = response.status || response.coupon?.effectiveStatus || response.coupon?.status;
    if (status === 'ISSUED') {
      showApprovedCoupon(response.coupon, response.message || 'อนุมัติแล้ว บันทึกคูปองไว้ใช้สิทธิ์');
      return;
    }
    if (status === 'PENDING') {
      pendingStatus.textContent = `ยังรอพนักงานอนุมัติ อัปเดตล่าสุด ${formatClock(new Date())}`;
      return;
    }
    if (status === 'NOT_FOUND') {
      pendingStatus.textContent = `กำลังรอข้อมูลคำขอ อัปเดตล่าสุด ${formatClock(new Date())}`;
      return;
    }
    handleClaimResponse(response, {
      customerName: nameInput.value.trim(),
      customerPhone: currentPhone,
    });
  } catch (error) {
    pendingStatus.textContent = error.message || 'เช็กสถานะไม่สำเร็จ ระบบจะลองใหม่อัตโนมัติ';
  } finally {
    isApprovalPollRunning = false;
  }
}

function normalizePhone(value) {
  return String(value || '').replace(/\D/g, '');
}

function isValidPhone(value) {
  return /^\d{10}$/.test(normalizePhone(value));
}

function formatClock(date) {
  return new Intl.DateTimeFormat('th-TH', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    timeZone: 'Asia/Bangkok',
  }).format(date);
}
