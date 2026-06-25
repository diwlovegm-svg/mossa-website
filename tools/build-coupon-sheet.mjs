import fs from 'node:fs/promises';
import path from 'node:path';
import { SpreadsheetFile, Workbook } from '@oai/artifact-tool';

const outputDir = path.resolve('outputs/coupon-sheet');
await fs.mkdir(outputDir, { recursive: true });

const workbook = Workbook.create();
const coupons = workbook.worksheets.add('Coupons');
const settings = workbook.worksheets.add('Settings');

coupons.showGridLines = false;
settings.showGridLines = false;

const couponHeaders = [
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

coupons.getRange('A1:K1').values = [couponHeaders];
coupons.getRange('A1:K1').format = {
  fill: '#0F766E',
  font: { bold: true, color: '#FFFFFF' },
  wrapText: true,
};
coupons.getRange('A1:K101').format.borders = {
  preset: 'inside',
  style: 'thin',
  color: '#D9E7E5',
};
coupons.getRange('A1:K101').format.columnWidthPx = 150;
coupons.getRange('A:A').format.columnWidthPx = 190;
coupons.getRange('B:B').format.columnWidthPx = 270;
coupons.getRange('D:D').format.columnWidthPx = 180;
coupons.getRange('F:H').format.columnWidthPx = 220;
coupons.getRange('I:I').format.columnWidthPx = 150;
coupons.getRange('J:J').format.columnWidthPx = 380;
coupons.getRange('K:K').format.columnWidthPx = 220;
coupons.getRange('A:K').format.numberFormat = '@';
coupons.freezePanes.freezeRows(1);

coupons.getRange('A2:K2').values = [[
  'SRH-290669-001-DEMO',
  'srirayong-free-trial-2026-06',
  'VOID',
  'ตัวอย่าง ลูกค้า',
  '0890000000',
  "'2026-06-25T09:00:00+07:00",
  "'2026-06-29T23:59:59+07:00",
  '',
  '2026-06-24-a',
  'Demo row. Keep status VOID or delete before real booth use.',
  "'2026-06-25T09:00:00+07:00",
]];

settings.getRange('A1:D1').merge();
settings.getRange('A1:D1').values = [['MOSSA Coupon Srirayong Backend Setup']];
settings.getRange('A1:D1').format = {
  fill: '#0F766E',
  font: { bold: true, color: '#FFFFFF', size: 16 },
};
settings.getRange('A3:B12').values = [
  ['campaignId', 'srirayong-free-trial-2026-06'],
  ['branchName', 'ศรีระยอง'],
  ['couponPrefix', 'SRH'],
  ['dateToken', '290669'],
  ['expiresAt', "'2026-06-29T23:59:59+07:00"],
  ['statuses', 'ISSUED, REDEEMED, EXPIRED, VOID'],
  ['spreadsheetIdProperty', 'Optional: set SPREADSHEET_ID for standalone Apps Script'],
  ['frontendConfig', 'Set apiEndpoint in srirayong/shared/campaignConfig.js'],
  ['templateConfig', 'Config page saves coupon design to the CouponConfig tab'],
  ['sourceOfTruth', 'Coupon status in this Google Sheet controls redemption'],
];
settings.getRange('A3:A12').format = {
  fill: '#CCFBF1',
  font: { bold: true, color: '#115E59' },
};
settings.getRange('A3:B12').format.borders = {
  preset: 'all',
  style: 'thin',
  color: '#B6E8E2',
};
settings.getRange('A:A').format.columnWidthPx = 180;
settings.getRange('B:B').format.columnWidthPx = 520;
settings.freezePanes.freezeRows(1);

const inspect = await workbook.inspect({
  kind: 'sheet,table',
  maxChars: 3000,
  tableMaxRows: 4,
  tableMaxCols: 12,
});
console.log(inspect.ndjson);

const preview = await workbook.render({
  sheetName: 'Coupons',
  range: 'A1:K8',
  scale: 1,
  format: 'png',
});
await fs.writeFile(
  path.join(outputDir, 'coupon-sheet-preview.png'),
  new Uint8Array(await preview.arrayBuffer()),
);

const exported = await SpreadsheetFile.exportXlsx(workbook);
const outputPath = path.join(outputDir, 'mossa-coupon-srirayong-backend.xlsx');
await exported.save(outputPath);
console.log(outputPath);
