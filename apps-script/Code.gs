const SHEET_NAME = 'Coupons';
const CONFIG_SHEET_NAME = 'CouponConfig';
const DEFAULT_SPREADSHEET_ID = '12TeNknzibjJeNylekXK48O6s6AxMvDBhPJT3uINQENs';
const APPROVAL_FLOW_VERSION = '2026-06-27-a';
const CAMPAIGN_CONFIG = {
  campaignId: 'srirayong-free-trial-2026-06',
  codePrefix: 'SRH',
  dateToken: '290669',
  sequencePad: 3,
  randomLength: 3,
  randomAlphabet: 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789',
  expiresAt: '2026-06-29T23:59:59+07:00',
};

const HEADERS = [
  'code',
  'campaignId',
  'status',
  'customerName',
  'customerPhone',
  'issuedAt',
  'expiresAt',
  'redeemedAt',
  'templateVersion',
  'notes',
  'updatedAt',
];

const DEFAULT_COUPON_CONFIG = {
  campaign: {
    campaignId: 'srirayong-free-trial-2026-06',
    branchName: 'ศรีระยอง',
    timezone: 'Asia/Bangkok',
    couponCode: {
      prefix: 'SRH',
      dateToken: '290669',
      sequencePad: 3,
      randomLength: 3,
      randomAlphabet: 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789',
    },
    couponValidity: {
      expiresAt: '2026-06-29T23:59:59+07:00',
      displayText: '29 มิถุนายน 2569',
    },
  },
  template: {
    version: '2026-06-24-a',
    campaignName: 'MOSSA Sport Society',
    branchLabel: 'สาขาศรีระยอง',
    logoText: 'MOSSA',
    logoUrl: '',
    title: 'คูปองทดลองฟรี 1 วัน',
    subtitle: 'เข้าใช้บริการ MOSSA Sport Society ฟรี 1 วัน',
    bodyText: 'แสดงคูปองนี้กับพนักงานก่อนเข้าใช้บริการ สิทธิ์จะสมบูรณ์เมื่อพนักงานตรวจสอบและกดยืนยันใช้สิทธิ์ในระบบ',
    badgeText: 'FREE TRIAL',
    primaryColor: '#0f766e',
    accentColor: '#14b8a6',
    backgroundColor: '#f8fafc',
    textColor: '#0f172a',
    expiresLabel: 'ใช้ได้ถึง',
    terms: [
      'ใช้ได้ 1 ครั้งต่อ 1 คน',
      'สำหรับลูกค้าใหม่หรือผู้ที่ MOSSA กำหนดเท่านั้น',
      'ไม่สามารถแลกเปลี่ยนเป็นเงินสดได้',
      'ระบบหลังบ้านเป็นตัวตัดสินสถานะการใช้งานจริง',
    ],
    showQrCode: false,
    showBarcode: true,
  },
};

function setupCouponSheet() {
  const sheet = getCouponSheet_();
  ensureHeaders_(sheet);
  ensureConfigSheet_();
}

function setupInitialProperties() {
  const properties = PropertiesService.getScriptProperties();
  properties.setProperties({
    SPREADSHEET_ID: properties.getProperty('SPREADSHEET_ID') || DEFAULT_SPREADSHEET_ID,
  });
}

function doGet(event) {
  const callback = event.parameter.callback;
  let response;

  try {
    const payload = JSON.parse(event.parameter.payload || '{}');
    response = handleRequest_(payload);
  } catch (error) {
    response = {
      ok: false,
      message: error.message || 'Unknown error',
    };
  }

  const body = callback
    ? `${callback}(${JSON.stringify(response)});`
    : JSON.stringify(response);

  return ContentService
    .createTextOutput(body)
    .setMimeType(callback ? ContentService.MimeType.JAVASCRIPT : ContentService.MimeType.JSON);
}

function handleRequest_(payload) {
  if (payload.campaignId && payload.campaignId !== CAMPAIGN_CONFIG.campaignId) {
    throw new Error('Campaign ID ไม่ตรงกับระบบ');
  }

  const action = payload.action;
  const data = payload.data || {};

  if (action === 'getConfig') {
    return {
      ok: true,
      config: getCouponConfig_(),
    };
  }
  if (action === 'validateEditorPasscode') {
    validateCouponEditorPasscode_(data.editorPasscode);
    return {
      ok: true,
      message: 'รหัสถูกต้อง',
    };
  }
  if (action === 'updateConfig') {
    validateCouponEditorPasscode_(data.editorPasscode);
    return updateCouponConfig_(data.config || {});
  }
  if (action === 'claim') {
    return claimCoupon_(data, payload.templateVersion || '');
  }
  if (action === 'claimStatus') {
    return claimStatus_(data.customerPhone);
  }
  if (action === 'listPendingCoupons') {
    return listPendingCoupons_();
  }
  if (action === 'approveCoupon') {
    return approveCoupon_(data.couponCode);
  }
  if (action === 'check') {
    return checkCoupon_(data.couponCode);
  }
  if (action === 'redeem') {
    return redeemCoupon_(data.couponCode);
  }

  throw new Error(`Unknown action: ${action}`);
}

function claimCoupon_(data, templateVersion) {
  const config = getCouponConfig_();
  const campaign = config.campaign || DEFAULT_COUPON_CONFIG.campaign;
  const customerName = String(data.customerName || '').trim();
  const customerPhone = normalizePhone_(data.customerPhone);

  if (!customerName || !customerPhone) {
    throw new Error('กรุณากรอกชื่อและเบอร์โทรให้ครบ');
  }
  if (!isValidPhone_(customerPhone)) {
    throw new Error('กรุณากรอกเบอร์โทรให้ครบ 10 หลัก');
  }

  const lock = LockService.getScriptLock();
  lock.waitLock(10000);

  try {
    const sheet = getCouponSheet_();
    ensureHeaders_(sheet);
    const records = getRecords_(sheet);
    const existing = records.find((record) => {
      return record.campaignId === CAMPAIGN_CONFIG.campaignId
        && normalizeStoredPhone_(record.customerPhone) === customerPhone
        && record.status !== 'VOID';
    });

    if (existing) {
      const existingStatus = getEffectiveStatus_(existing);
      return {
        ok: true,
        approvalRequired: true,
        approvalFlowVersion: APPROVAL_FLOW_VERSION,
        status: existingStatus,
        message: getClaimMessage_(existingStatus),
        coupon: toCouponResponse_(existing),
      };
    }

    const now = new Date();
    const coupon = {
      code: generateCouponCode_(records, campaign),
      campaignId: CAMPAIGN_CONFIG.campaignId,
      status: 'PENDING',
      customerName,
      customerPhone,
      issuedAt: now.toISOString(),
      expiresAt: campaign.couponValidity.expiresAt,
      redeemedAt: '',
      templateVersion: templateVersion || config.template.version,
      notes: '',
      updatedAt: now.toISOString(),
    };

    appendRecord_(sheet, coupon);

    return {
      ok: true,
      approvalRequired: true,
      approvalFlowVersion: APPROVAL_FLOW_VERSION,
      status: 'PENDING',
      message: 'ส่งคำขอรับคูปองแล้ว กรุณารอพนักงานอนุมัติ',
      coupon,
    };
  } finally {
    lock.releaseLock();
  }
}

function claimStatus_(customerPhoneValue) {
  const customerPhone = normalizePhone_(customerPhoneValue);
  if (!isValidPhone_(customerPhone)) {
    throw new Error('กรุณากรอกเบอร์โทรให้ครบ 10 หลัก');
  }

  const sheet = getCouponSheet_();
  ensureHeaders_(sheet);
  const records = getRecords_(sheet);
  const record = records.find((item) => {
    return item.campaignId === CAMPAIGN_CONFIG.campaignId
      && normalizeStoredPhone_(item.customerPhone) === customerPhone
      && item.status !== 'VOID';
  });

  if (!record) {
    return {
      ok: true,
      approvalRequired: true,
      approvalFlowVersion: APPROVAL_FLOW_VERSION,
      status: 'NOT_FOUND',
      coupon: null,
    };
  }

  const effectiveStatus = getEffectiveStatus_(record);
  return {
    ok: true,
    approvalRequired: true,
    approvalFlowVersion: APPROVAL_FLOW_VERSION,
    status: effectiveStatus,
    message: getClaimMessage_(effectiveStatus),
    coupon: toCouponResponse_(record),
  };
}

function listPendingCoupons_() {
  const sheet = getCouponSheet_();
  ensureHeaders_(sheet);
  const coupons = getRecords_(sheet)
    .filter((record) => {
      return record.campaignId === CAMPAIGN_CONFIG.campaignId && record.status === 'PENDING';
    })
    .reverse()
    .map((record) => toCouponResponse_(record));

  return {
    ok: true,
    approvalRequired: true,
    approvalFlowVersion: APPROVAL_FLOW_VERSION,
    coupons,
  };
}

function approveCoupon_(couponCode) {
  const code = normalizeCode_(couponCode);
  if (!code) {
    throw new Error('กรุณากรอกรหัสคูปอง');
  }

  const lock = LockService.getScriptLock();
  lock.waitLock(10000);

  try {
    const sheet = getCouponSheet_();
    ensureHeaders_(sheet);
    const records = getRecords_(sheet);
    const record = records.find((item) => normalizeCode_(item.code) === code);

    if (!record) {
      return {
        ok: true,
        approvalRequired: true,
        approvalFlowVersion: APPROVAL_FLOW_VERSION,
        status: 'NOT_FOUND',
        coupon: null,
      };
    }

    if (record.status !== 'PENDING') {
      return {
        ok: true,
        approvalRequired: true,
        approvalFlowVersion: APPROVAL_FLOW_VERSION,
        status: getEffectiveStatus_(record),
        message: 'คำขอนี้ไม่ได้อยู่ในสถานะรออนุมัติ',
        coupon: toCouponResponse_(record),
      };
    }

    updateRecordStatus_(sheet, record.rowNumber, 'ISSUED', '', record);
    record.status = 'ISSUED';
    record.updatedAt = new Date().toISOString();

    return {
      ok: true,
      approvalRequired: true,
      approvalFlowVersion: APPROVAL_FLOW_VERSION,
      status: 'ISSUED',
      message: 'อนุมัติคูปองแล้ว ลูกค้าจะเห็นคูปองในหน้ารับคูปอง',
      coupon: toCouponResponse_(record),
    };
  } finally {
    lock.releaseLock();
  }
}

function checkCoupon_(couponCode) {
  const code = normalizeCode_(couponCode);
  if (!code) {
    throw new Error('กรุณากรอกรหัสคูปอง');
  }

  const sheet = getCouponSheet_();
  ensureHeaders_(sheet);
  const records = getRecords_(sheet);
  const record = records.find((item) => normalizeCode_(item.code) === code);

  if (!record) {
    return {
      ok: true,
      status: 'NOT_FOUND',
      coupon: null,
    };
  }

  const effectiveStatus = getEffectiveStatus_(record);
  if (record.status === 'ISSUED' && effectiveStatus === 'EXPIRED') {
    updateRecordStatus_(sheet, record.rowNumber, 'EXPIRED', '', record);
    record.status = 'EXPIRED';
  }

  return {
    ok: true,
    status: effectiveStatus,
    coupon: toCouponResponse_(record),
  };
}

function redeemCoupon_(couponCode) {
  const code = normalizeCode_(couponCode);
  if (!code) {
    throw new Error('กรุณากรอกรหัสคูปอง');
  }

  const lock = LockService.getScriptLock();
  lock.waitLock(10000);

  try {
    const sheet = getCouponSheet_();
    ensureHeaders_(sheet);
    const records = getRecords_(sheet);
    const record = records.find((item) => normalizeCode_(item.code) === code);

    if (!record) {
      return {
        ok: true,
        status: 'NOT_FOUND',
        coupon: null,
      };
    }

    const effectiveStatus = getEffectiveStatus_(record);
    if (effectiveStatus !== 'ISSUED') {
      return {
        ok: true,
        status: effectiveStatus,
        message: 'คูปองนี้ไม่อยู่ในสถานะที่ใช้สิทธิ์ได้',
        coupon: toCouponResponse_(record),
      };
    }

    const redeemedAt = new Date().toISOString();
    updateRecordStatus_(sheet, record.rowNumber, 'REDEEMED', redeemedAt, record);
    record.status = 'REDEEMED';
    record.redeemedAt = redeemedAt;
    record.updatedAt = redeemedAt;

    return {
      ok: true,
      status: 'REDEEMED',
      redeemedNow: true,
      message: 'ยืนยันใช้สิทธิ์เรียบร้อยแล้ว',
      coupon: toCouponResponse_(record),
    };
  } finally {
    lock.releaseLock();
  }
}

function getCouponSheet_() {
  const spreadsheet = getSpreadsheet_();
  return spreadsheet.getSheetByName(SHEET_NAME) || spreadsheet.insertSheet(SHEET_NAME);
}

function getSpreadsheet_() {
  const spreadsheetId = PropertiesService.getScriptProperties().getProperty('SPREADSHEET_ID') || DEFAULT_SPREADSHEET_ID;
  const spreadsheet = spreadsheetId
    ? SpreadsheetApp.openById(spreadsheetId)
    : SpreadsheetApp.getActiveSpreadsheet();

  if (!spreadsheet) {
    throw new Error('ไม่พบ Spreadsheet: ให้ bind script กับ Google Sheet หรือ set SPREADSHEET_ID');
  }

  return spreadsheet;
}

function getCouponConfig_() {
  const sheet = ensureConfigSheet_();
  const rawConfig = sheet.getRange(2, 2).getValue();

  if (!rawConfig) {
    return clone_(DEFAULT_COUPON_CONFIG);
  }

  try {
    return normalizeCouponConfig_(JSON.parse(rawConfig));
  } catch (error) {
    return clone_(DEFAULT_COUPON_CONFIG);
  }
}

function validateCouponEditorPasscode_(editorPasscode) {
  const expectedPasscode = PropertiesService
    .getScriptProperties()
    .getProperty('COUPON_EDITOR_PASSCODE');

  if (!expectedPasscode) {
    throw new Error('ยังไม่ได้ตั้งค่ารหัสแก้ไขคูปองใน Apps Script');
  }

  if (String(editorPasscode || '') !== expectedPasscode) {
    throw new Error('รหัสแก้ไขคูปองไม่ถูกต้อง');
  }
}

function updateCouponConfig_(config) {
  const mergedConfig = normalizeCouponConfig_(config);
  const sheet = ensureConfigSheet_();
  sheet.getRange(1, 1, 3, 2).setValues([
    ['key', 'value'],
    ['configJson', JSON.stringify(mergedConfig)],
    ['updatedAt', new Date().toISOString()],
  ]);
  sheet.setFrozenRows(1);
  return {
    ok: true,
    message: 'บันทึก Template แล้ว',
    config: mergedConfig,
  };
}

function normalizeCouponConfig_(config) {
  const mergedConfig = mergeDeep_(clone_(DEFAULT_COUPON_CONFIG), config || {});
  const campaign = mergedConfig.campaign || {};
  delete campaign.apiEndpoint;
  delete campaign.backendSpreadsheetId;
  delete campaign.backendSpreadsheetUrl;
  delete campaign.mockModeWhenApiMissing;
  delete campaign.demoModeQueryParam;
  return mergedConfig;
}

function ensureConfigSheet_() {
  const spreadsheet = getSpreadsheet_();
  const sheet = spreadsheet.getSheetByName(CONFIG_SHEET_NAME) || spreadsheet.insertSheet(CONFIG_SHEET_NAME);
  const header = sheet.getRange(1, 1, 1, 2).getValues()[0];
  const rawConfig = sheet.getRange(2, 2).getValue();

  if (header[0] !== 'key' || header[1] !== 'value' || !rawConfig) {
    sheet.getRange(1, 1, 3, 2).setValues([
      ['key', 'value'],
      ['configJson', JSON.stringify(DEFAULT_COUPON_CONFIG)],
      ['updatedAt', new Date().toISOString()],
    ]);
    sheet.setFrozenRows(1);
  }

  return sheet;
}

function mergeDeep_(base, override) {
  Object.keys(override || {}).forEach((key) => {
    const value = override[key];
    if (Array.isArray(value)) {
      base[key] = value.slice();
    } else if (value && typeof value === 'object') {
      base[key] = mergeDeep_(base[key] && typeof base[key] === 'object' ? base[key] : {}, value);
    } else if (value !== undefined) {
      base[key] = value;
    }
  });
  return base;
}

function clone_(value) {
  return JSON.parse(JSON.stringify(value));
}

function ensureHeaders_(sheet) {
  const headerRange = sheet.getRange(1, 1, 1, HEADERS.length);
  const currentHeaders = headerRange.getValues()[0];
  const needsHeaders = HEADERS.some((header, index) => currentHeaders[index] !== header);

  if (needsHeaders) {
    headerRange.setValues([HEADERS]);
    sheet.setFrozenRows(1);
  }

  ensureColumnFormats_(sheet);
}

function ensureColumnFormats_(sheet) {
  const phoneColumn = HEADERS.indexOf('customerPhone') + 1;
  if (phoneColumn > 0) {
    sheet.getRange(1, phoneColumn, sheet.getMaxRows(), 1).setNumberFormat('@');
  }
}

function getRecords_(sheet) {
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) {
    return [];
  }

  const values = sheet.getRange(2, 1, lastRow - 1, HEADERS.length).getValues();
  return values.map((row, index) => {
    const record = { rowNumber: index + 2 };
    HEADERS.forEach((header, headerIndex) => {
      record[header] = normalizeSheetValue_(row[headerIndex]);
    });
    return record;
  });
}

function appendRecord_(sheet, record) {
  const rowNumber = Math.max(sheet.getLastRow() + 1, 2);
  const values = HEADERS.map((header) => header === 'customerPhone'
    ? String(record[header] || '')
    : record[header] || '');
  const phoneColumn = HEADERS.indexOf('customerPhone') + 1;
  if (phoneColumn > 0) {
    sheet.getRange(rowNumber, phoneColumn).setNumberFormat('@');
  }
  sheet.getRange(rowNumber, 1, 1, HEADERS.length).setValues([values]);
}

function updateRecordStatus_(sheet, rowNumber, status, redeemedAt, record) {
  const updatedAt = new Date().toISOString();
  sheet.getRange(rowNumber, HEADERS.indexOf('status') + 1).setValue(status);
  sheet.getRange(rowNumber, HEADERS.indexOf('redeemedAt') + 1).setValue(redeemedAt || record.redeemedAt || '');
  sheet.getRange(rowNumber, HEADERS.indexOf('updatedAt') + 1).setValue(updatedAt);
}

function generateCouponCode_(records, campaign) {
  const couponCode = campaign.couponCode || DEFAULT_COUPON_CONFIG.campaign.couponCode;
  const sequence = records
    .filter((record) => record.campaignId === CAMPAIGN_CONFIG.campaignId)
    .map((record) => {
      const parts = String(record.code || '').split('-');
      return Number(parts[2] || 0);
    })
    .reduce((max, current) => Math.max(max, current), 0) + 1;

  return [
    couponCode.prefix,
    couponCode.dateToken,
    String(sequence).padStart(couponCode.sequencePad, '0'),
    randomToken_(couponCode.randomLength, couponCode.randomAlphabet),
  ].join('-');
}

function randomToken_(length, alphabet) {
  alphabet = alphabet || CAMPAIGN_CONFIG.randomAlphabet;
  let output = '';
  for (let index = 0; index < length; index += 1) {
    output += alphabet[Math.floor(Math.random() * alphabet.length)];
  }
  return output;
}

function getEffectiveStatus_(record) {
  if (record.status !== 'ISSUED') {
    return record.status || 'NOT_FOUND';
  }

  const expiresAt = new Date(record.expiresAt);
  if (!Number.isNaN(expiresAt.getTime()) && expiresAt.getTime() < Date.now()) {
    return 'EXPIRED';
  }

  return 'ISSUED';
}

function toCouponResponse_(record) {
  return {
    code: record.code,
    campaignId: record.campaignId,
    status: record.status,
    effectiveStatus: getEffectiveStatus_(record),
    customerName: record.customerName,
    customerPhone: normalizeStoredPhone_(record.customerPhone),
    issuedAt: record.issuedAt,
    expiresAt: record.expiresAt,
    redeemedAt: record.redeemedAt,
    templateVersion: record.templateVersion,
    updatedAt: record.updatedAt,
  };
}

function normalizePhone_(value) {
  return String(value || '').replace(/\D/g, '');
}

function normalizeStoredPhone_(value) {
  const digits = normalizePhone_(value);
  if (digits.length === 9) {
    return `0${digits}`;
  }
  return digits;
}

function isValidPhone_(value) {
  return /^\d{10}$/.test(normalizePhone_(value));
}

function getClaimMessage_(status) {
  if (status === 'PENDING') return 'คำขอรับคูปองกำลังรอพนักงานอนุมัติ';
  if (status === 'ISSUED') return 'คำขอได้รับการอนุมัติแล้ว ระบบดึงคูปองให้';
  if (status === 'REDEEMED') return 'เบอร์นี้ใช้สิทธิ์ไปแล้ว ไม่สามารถรับคูปองซ้ำได้';
  if (status === 'EXPIRED') return 'คูปองของเบอร์นี้หมดอายุแล้ว';
  if (status === 'VOID') return 'คูปองของเบอร์นี้ถูกยกเลิกแล้ว';
  return 'พบข้อมูลคำขอรับคูปอง';
}

function normalizeCode_(value) {
  return String(value || '').trim().toUpperCase();
}

function normalizeSheetValue_(value) {
  if (value instanceof Date) {
    return value.toISOString();
  }
  return value;
}
