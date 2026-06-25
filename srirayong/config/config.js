import { fetchCouponSettings, saveCouponSettings, validateCouponEditorPasscode } from '../shared/apiClient.js';
import { applyCouponSettings, getCampaignConfig, getCouponSettings, getCouponTemplate } from '../shared/runtimeConfig.js';
import { renderCoupon } from '../shared/couponRenderer.js';
import { mountInstallButton, registerPwa, renderRuntimeStatus } from '../shared/pwa.js';

const SESSION_PASSCODE_KEY = 'mossa-coupon-editor-passcode';

const lockPanel = document.querySelector('#lockPanel');
const lockForm = document.querySelector('#lockForm');
const passcodeInput = document.querySelector('#editorPasscode');
const unlockButton = document.querySelector('#unlockButton');
const lockNotice = document.querySelector('#lockNotice');
const editorPanel = document.querySelector('#editorPanel');
const templateForm = document.querySelector('#templateForm');
const templateNotice = document.querySelector('#templateNotice');
const templatePreview = document.querySelector('#templatePreview');
const reloadTemplateButton = document.querySelector('#reloadTemplate');
const previewTemplateButton = document.querySelector('#previewTemplate');
const saveTemplateButton = document.querySelector('#saveTemplate');
const installButton = document.querySelector('#installApp');
const runtimeStatus = document.querySelector('#runtimeStatus');

let editorPasscode = '';

registerPwa();
mountInstallButton(installButton);
renderRuntimeStatus(runtimeStatus);

restoreEditorSession();

lockForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  clearNotice(lockNotice);
  const passcode = passcodeInput.value.trim();

  if (!passcode) {
    showNotice(lockNotice, 'กรุณากรอกรหัสแก้ไขคูปอง', 'error');
    passcodeInput.focus();
    return;
  }

  setButtonLoading(unlockButton, true, 'กำลังเปิดหน้าแก้ไข...');
  try {
    await verifyEditorPasscode(passcode);
    await unlockEditor(passcode);
  } catch (error) {
    showNotice(lockNotice, error.message || 'รหัสแก้ไขคูปองไม่ถูกต้อง', 'error');
    passcodeInput.select();
  } finally {
    setButtonLoading(unlockButton, false, 'เข้าแก้ไขคูปอง');
  }
});

reloadTemplateButton.addEventListener('click', async () => {
  await loadTemplateSettings();
});

previewTemplateButton.addEventListener('click', () => {
  applyFormSettings();
  renderTemplatePreview();
});

templateForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  clearNotice(templateNotice);
  setButtonLoading(saveTemplateButton, true, 'กำลังบันทึก...');

  try {
    const settings = applyFormSettings();
    await saveCouponSettings(settings, editorPasscode);
    fillTemplateForm();
    renderTemplatePreview();
    showNotice(templateNotice, 'บันทึก Template แล้ว คูปองใหม่จะใช้ค่านี้ทันที', 'success');
  } catch (error) {
    if (String(error.message || '').includes('รหัสแก้ไขคูปอง')) {
      lockEditor();
    }
    showNotice(templateNotice, error.message || 'บันทึก Template ไม่สำเร็จ', 'error');
  } finally {
    setButtonLoading(saveTemplateButton, false, 'บันทึก Template');
  }
});

async function restoreEditorSession() {
  const storedPasscode = sessionStorage.getItem(SESSION_PASSCODE_KEY) || '';
  if (!storedPasscode) return;

  try {
    await verifyEditorPasscode(storedPasscode);
    await unlockEditor(storedPasscode);
  } catch {
    lockEditor();
  }
}

async function verifyEditorPasscode(passcode) {
  try {
    await validateCouponEditorPasscode(passcode);
  } catch (error) {
    if (!String(error.message || '').includes('Unknown action')) {
      throw error;
    }

    const config = await fetchCouponSettings();
    await saveCouponSettings(config, passcode);
  }
}

async function unlockEditor(passcode) {
  editorPasscode = passcode;
  sessionStorage.setItem(SESSION_PASSCODE_KEY, passcode);
  lockPanel.hidden = true;
  editorPanel.hidden = false;
  await loadTemplateSettings();
}

function lockEditor() {
  editorPasscode = '';
  sessionStorage.removeItem(SESSION_PASSCODE_KEY);
  lockPanel.hidden = false;
  editorPanel.hidden = true;
}

async function loadTemplateSettings() {
  clearNotice(templateNotice);
  setButtonLoading(reloadTemplateButton, true, 'กำลังโหลด...');

  try {
    await fetchCouponSettings();
    fillTemplateForm();
    renderTemplatePreview();
    showNotice(templateNotice, 'โหลด Template ล่าสุดแล้ว', 'success');
  } catch (error) {
    fillTemplateForm();
    renderTemplatePreview();
    showNotice(templateNotice, error.message || 'โหลด Template ไม่สำเร็จ', 'error');
  } finally {
    setButtonLoading(reloadTemplateButton, false, 'โหลดค่าล่าสุด');
  }
}

function fillTemplateForm() {
  const campaign = getCampaignConfig();
  const template = getCouponTemplate();

  setField('campaignName', template.campaignName);
  setField('branchLabel', template.branchLabel);
  setField('title', template.title);
  setField('subtitle', template.subtitle);
  setField('bodyText', template.bodyText);
  setField('badgeText', template.badgeText);
  setField('expiresLabel', template.expiresLabel);
  setField('expiresAt', campaign.couponValidity?.expiresAt);
  setField('displayText', campaign.couponValidity?.displayText);
  setField('codePrefix', campaign.couponCode?.prefix);
  setField('dateToken', campaign.couponCode?.dateToken);
  setField('logoText', template.logoText);
  setField('logoUrl', template.logoUrl);
  setField('primaryColor', template.primaryColor);
  setField('accentColor', template.accentColor);
  setField('backgroundColor', template.backgroundColor);
  setField('textColor', template.textColor);
  setField('terms', (template.terms || []).join('\n'));
  templateForm.elements.showBarcode.checked = Boolean(template.showBarcode);
  templateForm.elements.showQrCode.checked = Boolean(template.showQrCode);
}

function applyFormSettings() {
  const current = getCouponSettings();
  const currentCampaign = current.campaign || {};
  const currentCouponCode = currentCampaign.couponCode || {};
  const currentCouponValidity = currentCampaign.couponValidity || {};
  const settings = {
    campaign: {
      campaignId: currentCampaign.campaignId,
      branchName: currentCampaign.branchName,
      timezone: currentCampaign.timezone,
      couponValidity: {
        ...currentCouponValidity,
        expiresAt: getField('expiresAt'),
        displayText: getField('displayText'),
      },
      couponCode: {
        ...currentCouponCode,
        prefix: getField('codePrefix').toUpperCase(),
        dateToken: getField('dateToken'),
      },
    },
    template: {
      ...current.template,
      version: new Date().toISOString(),
      campaignName: getField('campaignName'),
      branchLabel: getField('branchLabel'),
      title: getField('title'),
      subtitle: getField('subtitle'),
      bodyText: getField('bodyText'),
      badgeText: getField('badgeText'),
      expiresLabel: getField('expiresLabel'),
      logoText: getField('logoText'),
      logoUrl: getField('logoUrl'),
      primaryColor: getField('primaryColor'),
      accentColor: getField('accentColor'),
      backgroundColor: getField('backgroundColor'),
      textColor: getField('textColor'),
      terms: getField('terms').split('\n').map((term) => term.trim()).filter(Boolean),
      showBarcode: templateForm.elements.showBarcode.checked,
      showQrCode: templateForm.elements.showQrCode.checked,
    },
  };

  applyCouponSettings(settings);
  return settings;
}

function renderTemplatePreview() {
  const campaign = getCampaignConfig();
  const code = [
    campaign.couponCode?.prefix || 'SRH',
    campaign.couponCode?.dateToken || '290669',
    '001',
    'A7K',
  ].join('-');

  renderCoupon(templatePreview, {
    code,
    customerName: 'ตัวอย่าง ลูกค้า',
    customerPhone: '0800000000',
    status: 'ISSUED',
    issuedAt: new Date().toISOString(),
    expiresAt: campaign.couponValidity?.expiresAt,
  });
}

function setButtonLoading(button, isLoading, label) {
  button.disabled = isLoading;
  button.textContent = label;
}

function showNotice(element, message, type) {
  element.textContent = message;
  element.dataset.type = type;
}

function clearNotice(element) {
  element.textContent = '';
  element.removeAttribute('data-type');
}

function setField(name, value) {
  templateForm.elements[name].value = value ?? '';
}

function getField(name) {
  return String(templateForm.elements[name].value || '').trim();
}
