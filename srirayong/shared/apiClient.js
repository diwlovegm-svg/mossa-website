import { campaignConfig as defaultCampaignConfig } from './campaignConfig.js';
import { applyCouponSettings, getCampaignConfig, getCouponSettings, getCouponTemplate } from './runtimeConfig.js';

const STORAGE_KEY = `mossa-coupons:${defaultCampaignConfig.campaignId}`;
const CONFIG_STORAGE_KEY = `mossa-coupon-config:${defaultCampaignConfig.campaignId}`;

export function claimCoupon(payload) {
  return request('claim', payload);
}

export function getClaimStatus(payload) {
  return request('claimStatus', payload);
}

export function checkCoupon(payload) {
  return request('check', payload);
}

export function redeemCoupon(payload) {
  return request('redeem', payload);
}

export function listPendingCoupons() {
  return request('listPendingCoupons', {});
}

export function approveCoupon(payload) {
  return request('approveCoupon', payload);
}

export async function fetchCouponSettings() {
  const response = await request('getConfig', {});
  applyCouponSettings(response.config);
  return response.config;
}

export async function saveCouponSettings(config, editorPasscode = '') {
  const response = await request('updateConfig', { config, editorPasscode });
  applyCouponSettings(response.config);
  return response.config;
}

export function validateCouponEditorPasscode(editorPasscode = '') {
  return request('validateEditorPasscode', { editorPasscode });
}

export function getRuntimeMode() {
  if (getCampaignConfig().apiEndpoint) {
    return 'live';
  }

  if (isDemoModeAllowed()) {
    return 'demo';
  }

  return 'setup';
}

async function request(action, data) {
  const campaignConfig = getCampaignConfig();
  if (!campaignConfig.apiEndpoint) {
    if (!isDemoModeAllowed()) {
      throw new Error('ระบบยังไม่ได้เชื่อม Google Apps Script กรุณาตั้งค่า apiEndpoint ก่อนใช้งานจริง');
    }
    return mockRequest(action, data);
  }

  return jsonpRequest(action, data);
}

function jsonpRequest(action, data) {
  const campaignConfig = getCampaignConfig();
  const couponTemplate = getCouponTemplate();
  const callbackName = `mossaCouponCallback_${Date.now()}_${Math.random().toString(36).slice(2)}`;
  const payload = {
    action,
    campaignId: campaignConfig.campaignId,
    templateVersion: couponTemplate.version,
    data,
  };

  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    const timeoutId = window.setTimeout(() => {
      cleanup();
      reject(new Error('เชื่อมต่อ Apps Script ไม่สำเร็จ กรุณาเช็กอินเทอร์เน็ตแล้วลองใหม่'));
    }, 15000);

    window[callbackName] = (response) => {
      cleanup();
      if (response?.ok) {
        resolve(response);
        return;
      }
      reject(new Error(response?.message || 'ระบบคูปองตอบกลับไม่สำเร็จ'));
    };

    const url = new URL(campaignConfig.apiEndpoint);
    url.searchParams.set('callback', callbackName);
    url.searchParams.set('payload', JSON.stringify(payload));
    script.src = url.toString();
    script.onerror = () => {
      cleanup();
      reject(new Error('โหลด Apps Script ไม่ได้ อาจถูก Chrome หรือ Extension บล็อก กรุณาอนุญาต script.google.com'));
    };

    document.body.append(script);

    function cleanup() {
      window.clearTimeout(timeoutId);
      delete window[callbackName];
      script.remove();
    }
  });
}

function mockRequest(action, data) {
  const coupons = readCoupons();

  if (action === 'getConfig') {
    return {
      ok: true,
      config: readConfig(),
      source: 'mock',
    };
  }
  if (action === 'validateEditorPasscode') {
    assertMockEditorPasscode(data.editorPasscode);
    return {
      ok: true,
      message: 'รหัสถูกต้อง',
      source: 'mock',
    };
  }
  if (action === 'updateConfig') {
    assertMockEditorPasscode(data.editorPasscode);
    writeConfig(data.config);
    return {
      ok: true,
      config: readConfig(),
      source: 'mock',
    };
  }
  if (action === 'claim') {
    return mockClaim(coupons, data);
  }
  if (action === 'claimStatus') {
    return mockClaimStatus(coupons, data);
  }
  if (action === 'listPendingCoupons') {
    return mockListPendingCoupons(coupons);
  }
  if (action === 'approveCoupon') {
    return mockApproveCoupon(coupons, data);
  }
  if (action === 'check') {
    return mockCheck(coupons, data);
  }
  if (action === 'redeem') {
    return mockRedeem(coupons, data);
  }

  throw new Error(`ไม่รู้จัก action: ${action}`);
}

function assertMockEditorPasscode(editorPasscode) {
  if (!String(editorPasscode || '').trim()) {
    throw new Error('รหัสแก้ไขคูปองไม่ถูกต้อง');
  }
}

function mockClaim(coupons, data) {
  const campaignConfig = getCampaignConfig();
  const couponTemplate = getCouponTemplate();
  const customerName = String(data.customerName || '').trim();
  const customerPhone = normalizePhone(data.customerPhone);

  if (!customerName || !customerPhone) {
    throw new Error('กรุณากรอกชื่อและเบอร์โทรให้ครบ');
  }
  if (!isValidPhone(customerPhone)) {
    throw new Error('กรุณากรอกเบอร์โทรให้ครบ 10 หลัก');
  }

  const existingCoupon = coupons.find((coupon) => {
    return coupon.customerPhone === customerPhone && coupon.status !== 'VOID';
  });

  if (existingCoupon) {
    const effectiveCoupon = withEffectiveStatus(existingCoupon);
    return {
      ok: true,
      status: effectiveCoupon.effectiveStatus,
      message: getClaimMessage(effectiveCoupon.effectiveStatus),
      coupon: effectiveCoupon,
      source: 'mock',
    };
  }

  const coupon = {
    code: generateCouponCode(coupons),
    campaignId: campaignConfig.campaignId,
    status: 'PENDING',
    customerName,
    customerPhone,
    issuedAt: new Date().toISOString(),
    expiresAt: campaignConfig.couponValidity.expiresAt,
    redeemedAt: '',
    templateVersion: couponTemplate.version,
    updatedAt: new Date().toISOString(),
  };

  coupons.push(coupon);
  writeCoupons(coupons);

  return {
    ok: true,
    status: 'PENDING',
    message: 'ส่งคำขอรับคูปองแล้ว กรุณารอพนักงานอนุมัติ',
    coupon,
    source: 'mock',
  };
}

function mockClaimStatus(coupons, data) {
  const customerPhone = normalizePhone(data.customerPhone);
  if (!isValidPhone(customerPhone)) {
    throw new Error('กรุณากรอกเบอร์โทรให้ครบ 10 หลัก');
  }

  const coupon = coupons.find((item) => item.customerPhone === customerPhone && item.status !== 'VOID');
  if (!coupon) {
    return {
      ok: true,
      status: 'NOT_FOUND',
      coupon: null,
      source: 'mock',
    };
  }

  const effectiveCoupon = withEffectiveStatus(coupon);
  return {
    ok: true,
    status: effectiveCoupon.effectiveStatus,
    message: getClaimMessage(effectiveCoupon.effectiveStatus),
    coupon: effectiveCoupon,
    source: 'mock',
  };
}

function mockListPendingCoupons(coupons) {
  return {
    ok: true,
    coupons: coupons
      .filter((coupon) => coupon.status === 'PENDING')
      .map((coupon) => withEffectiveStatus(coupon))
      .reverse(),
    source: 'mock',
  };
}

function mockApproveCoupon(coupons, data) {
  const code = normalizeCode(data.couponCode);
  const index = coupons.findIndex((item) => item.code === code);

  if (index < 0) {
    return {
      ok: true,
      status: 'NOT_FOUND',
      coupon: null,
      source: 'mock',
    };
  }

  if (coupons[index].status !== 'PENDING') {
    const current = withEffectiveStatus(coupons[index]);
    return {
      ok: true,
      status: current.effectiveStatus,
      message: 'คำขอนี้ไม่ได้อยู่ในสถานะรออนุมัติ',
      coupon: current,
      source: 'mock',
    };
  }

  coupons[index] = {
    ...coupons[index],
    status: 'ISSUED',
    updatedAt: new Date().toISOString(),
  };
  writeCoupons(coupons);

  return {
    ok: true,
    status: 'ISSUED',
    message: 'อนุมัติคูปองแล้ว ลูกค้าจะเห็นคูปองในหน้ารับคูปอง',
    coupon: withEffectiveStatus(coupons[index]),
    source: 'mock',
  };
}

function mockCheck(coupons, data) {
  const code = normalizeCode(data.couponCode);
  const coupon = coupons.find((item) => item.code === code);

  if (!coupon) {
    return {
      ok: true,
      status: 'NOT_FOUND',
      coupon: null,
      source: 'mock',
    };
  }

  const effectiveCoupon = withEffectiveStatus(coupon);
  return {
    ok: true,
    status: effectiveCoupon.effectiveStatus,
    coupon: effectiveCoupon,
    source: 'mock',
  };
}

function mockRedeem(coupons, data) {
  const code = normalizeCode(data.couponCode);
  const index = coupons.findIndex((item) => item.code === code);

  if (index < 0) {
    return {
      ok: true,
      status: 'NOT_FOUND',
      coupon: null,
      source: 'mock',
    };
  }

  const current = withEffectiveStatus(coupons[index]);
  if (current.effectiveStatus !== 'ISSUED') {
    return {
      ok: true,
      status: current.effectiveStatus,
      message: 'คูปองนี้ไม่อยู่ในสถานะที่ใช้สิทธิ์ได้',
      coupon: current,
      source: 'mock',
    };
  }

  coupons[index] = {
    ...coupons[index],
    status: 'REDEEMED',
    redeemedAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  writeCoupons(coupons);

  return {
    ok: true,
    status: 'REDEEMED',
    redeemedNow: true,
    message: 'ยืนยันใช้สิทธิ์เรียบร้อยแล้ว',
    coupon: withEffectiveStatus(coupons[index]),
    source: 'mock',
  };
}

function generateCouponCode(coupons) {
  const campaignConfig = getCampaignConfig();
  const couponCode = campaignConfig.couponCode;
  const nextSequence = coupons.length + 1;
  const sequence = String(nextSequence).padStart(couponCode.sequencePad, '0');
  return [
    couponCode.prefix,
    couponCode.dateToken,
    sequence,
    randomToken(couponCode.randomLength, couponCode.randomAlphabet),
  ].join('-');
}

function randomToken(length, alphabet) {
  let output = '';
  for (let index = 0; index < length; index += 1) {
    output += alphabet[Math.floor(Math.random() * alphabet.length)];
  }
  return output;
}

function withEffectiveStatus(coupon) {
  const effectiveStatus = getEffectiveStatus(coupon);
  return {
    ...coupon,
    effectiveStatus,
  };
}

function getEffectiveStatus(coupon) {
  if (coupon.status !== 'ISSUED') {
    return coupon.status;
  }

  const expiresAt = new Date(coupon.expiresAt);
  if (!Number.isNaN(expiresAt.getTime()) && expiresAt.getTime() < Date.now()) {
    return 'EXPIRED';
  }

  return 'ISSUED';
}

function normalizePhone(value) {
  return String(value || '').replace(/\D/g, '');
}

function isValidPhone(value) {
  return /^\d{10}$/.test(normalizePhone(value));
}

function getClaimMessage(status) {
  if (status === 'PENDING') return 'คำขอรับคูปองกำลังรอพนักงานอนุมัติ';
  if (status === 'ISSUED') return 'คำขอได้รับการอนุมัติแล้ว ระบบดึงคูปองให้';
  if (status === 'REDEEMED') return 'เบอร์นี้ใช้สิทธิ์ไปแล้ว ไม่สามารถรับคูปองซ้ำได้';
  if (status === 'EXPIRED') return 'คูปองของเบอร์นี้หมดอายุแล้ว';
  if (status === 'VOID') return 'คูปองของเบอร์นี้ถูกยกเลิกแล้ว';
  return 'พบข้อมูลคำขอรับคูปอง';
}

function normalizeCode(value) {
  return String(value || '').trim().toUpperCase();
}

function readCoupons() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
  } catch {
    return [];
  }
}

function writeCoupons(coupons) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(coupons));
}

function isDemoModeAllowed() {
  const campaignConfig = getCampaignConfig();
  if (campaignConfig.mockModeWhenApiMissing) {
    return true;
  }

  if (!campaignConfig.demoModeQueryParam || typeof window === 'undefined') {
    return false;
  }

  return new URLSearchParams(window.location.search).has(campaignConfig.demoModeQueryParam);
}

function readConfig() {
  try {
    return JSON.parse(localStorage.getItem(CONFIG_STORAGE_KEY) || '{}');
  } catch {
    return {};
  }
}

function writeConfig(config) {
  localStorage.setItem(CONFIG_STORAGE_KEY, JSON.stringify(config || getCouponSettings()));
}
