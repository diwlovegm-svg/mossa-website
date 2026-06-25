import { claimCoupon, fetchCouponSettings } from '../shared/apiClient.js';
import { downloadCouponImage, renderCoupon } from '../shared/couponRenderer.js';
import { mountInstallButton, registerPwa, renderRuntimeStatus } from '../shared/pwa.js';

const form = document.querySelector('#claimForm');
const nameInput = document.querySelector('#customerName');
const phoneInput = document.querySelector('#customerPhone');
const claimButton = document.querySelector('#claimButton');
const notice = document.querySelector('#claimNotice');
const couponSection = document.querySelector('#couponSection');
const couponPreview = document.querySelector('#couponPreview');
const downloadButton = document.querySelector('#downloadCoupon');
const installButton = document.querySelector('#installApp');
const runtimeStatus = document.querySelector('#runtimeStatus');

let currentCoupon = null;

registerPwa();
mountInstallButton(installButton);
renderRuntimeStatus(runtimeStatus);
loadLatestSettings();

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  clearNotice();

  const customerName = nameInput.value.trim();
  const customerPhone = phoneInput.value.trim();

  if (!customerName || !customerPhone) {
    showNotice('กรุณากรอกชื่อและเบอร์โทรให้ครบ', 'error');
    return;
  }

  setLoading(true);
  try {
    await fetchCouponSettings();
    const response = await claimCoupon({ customerName, customerPhone });
    currentCoupon = response.coupon;
    couponSection.hidden = false;
    renderCoupon(couponPreview, currentCoupon);
    showNotice(response.message || 'ออกคูปองเรียบร้อยแล้ว', 'success');
    couponSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
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
  claimButton.textContent = isLoading ? 'กำลังออกคูปอง...' : 'รับคูปอง';
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
