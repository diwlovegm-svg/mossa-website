export const campaignConfig = {
  campaignId: 'srirayong-free-trial-2026-06',
  branchName: 'ศรีระยอง',
  apiEndpoint: 'https://script.google.com/macros/s/AKfycbxgtftZXY_gsFRwhzXh8ISrOeyMIH9IkqwZamIw9xFksKYoUiVBnVQ32dtWHBON06TOhg/exec',
  backendSpreadsheetId: '12TeNknzibjJeNylekXK48O6s6AxMvDBhPJT3uINQENs',
  backendSpreadsheetUrl: 'https://docs.google.com/spreadsheets/d/12TeNknzibjJeNylekXK48O6s6AxMvDBhPJT3uINQENs/edit',
  mockModeWhenApiMissing: false,
  demoModeQueryParam: 'demo',
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
};

export const statusPresentations = {
  PENDING: {
    label: 'รออนุมัติ',
    message: '⏳ คูปองนี้รอพนักงานอนุมัติ',
    type: 'muted',
  },
  ISSUED: {
    label: 'ใช้งานได้',
    message: '✅ คูปองใช้งานได้',
    type: 'success',
  },
  REDEEMED: {
    label: 'ใช้ไปแล้ว',
    message: '⚠️ คูปองนี้ถูกใช้ไปแล้ว',
    type: 'warning',
  },
  NOT_FOUND: {
    label: 'ไม่พบโค้ด',
    message: '❌ ไม่พบคูปองในระบบ',
    type: 'error',
  },
  EXPIRED: {
    label: 'หมดอายุ',
    message: '⏰ คูปองหมดอายุแล้ว',
    type: 'muted',
  },
  VOID: {
    label: 'ยกเลิกแล้ว',
    message: '❌ คูปองนี้ถูกยกเลิกแล้ว',
    type: 'error',
  },
};

export function getStatusPresentation(status) {
  return statusPresentations[status] || {
    label: status || 'ไม่ทราบสถานะ',
    message: 'ไม่ทราบสถานะคูปอง',
    type: 'muted',
  };
}
