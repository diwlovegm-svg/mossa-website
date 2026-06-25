# MOSSA Digital Coupon

Static GitHub Pages frontend for MOSSA coupon claiming and redemption, with Google Sheets as the operational database through Google Apps Script.

This is now structured as an installable web app/PWA. It includes:

- app launcher at `/srirayong/`
- customer claim route
- staff admin route
- owner coupon config route
- app manifest
- service worker and offline fallback
- install button where the browser supports PWA install prompts

## Routes

- App launcher: `/srirayong/`
- Customer claim page: `/srirayong/claim/`
- Counter coupon check page: `/srirayong/admin/`
- Owner coupon config page: `/srirayong/config/`

Current GitHub Pages deployment:

- `https://diwlovegm-svg.github.io/mossa-website/srirayong/`
- `https://diwlovegm-svg.github.io/mossa-website/srirayong/claim/`
- `https://diwlovegm-svg.github.io/mossa-website/srirayong/admin/`
- `https://diwlovegm-svg.github.io/mossa-website/srirayong/config/`

## Editable Coupon Template

Use the owner config page to edit coupon design and campaign rules:

- `https://mossa-coupon.github.io/srirayong/config/`
- current deployment: `https://diwlovegm-svg.github.io/mossa-website/srirayong/config/`
- local preview: `http://127.0.0.1:4175/srirayong/config/`

The config page asks for the coupon editor passcode before showing the form. It saves template settings to the `CouponConfig` tab in Google Sheets. Newly issued coupons use the latest saved template immediately.

The counter admin page at `/srirayong/admin/` is only for checking and redeeming coupons. It does not show coupon template controls.

The local fallback files still exist for default values:

- `srirayong/shared/campaignConfig.js`
  - campaign id
  - Apps Script API endpoint
  - coupon code format
  - expiration date
  - mock mode behavior
- `srirayong/shared/couponTemplate.js`
  - campaign name
  - coupon title
  - coupon copy
  - colors
  - logo
  - terms
  - QR code on/off
  - barcode on/off

Coupons already saved as images on customer phones do not change, but admin validation always uses Google Sheets status and expiration.

## Before Going Online

1. Deploy the latest `apps-script/Code.gs` as a new Apps Script Web App version.
2. Confirm Apps Script Script Properties include `COUPON_EDITOR_PASSCODE`.
3. Publish this folder to the GitHub Pages repository.
4. On the counter computer, open `https://diwlovegm-svg.github.io/mossa-website/srirayong/admin/` for barcode checking.
5. Keep `https://diwlovegm-svg.github.io/mossa-website/srirayong/config/` for the owner-only coupon editor.

## Google Sheets Backend Setup

Backend Google Sheet created for this app:

- `https://docs.google.com/spreadsheets/d/12TeNknzibjJeNylekXK48O6s6AxMvDBhPJT3uINQENs/edit`
- Spreadsheet ID: `12TeNknzibjJeNylekXK48O6s6AxMvDBhPJT3uINQENs`
- Apps Script Web App URL: `https://script.google.com/macros/s/AKfycbxgtftZXY_gsFRwhzXh8ISrOeyMIH9IkqwZamIw9xFksKYoUiVBnVQ32dtWHBON06TOhg/exec`

1. Open the Google Sheet above.
2. Open Apps Script from the sheet.
3. Paste `apps-script/Code.gs`.
4. In Apps Script, set script properties only if needed:
   - `SPREADSHEET_ID`: optional when the script is bound to the sheet; use `12TeNknzibjJeNylekXK48O6s6AxMvDBhPJT3uINQENs` for a standalone script.
   - `COUPON_EDITOR_PASSCODE`: required for the owner coupon config page. Keep this value private and set it in Apps Script Script Properties, not in the public frontend files.
5. Run `setupCouponSheet()` once to create the `Coupons` tab and headers.
6. Deploy as Web App:
   - Execute as: Me
   - Who has access: Anyone
7. Copy the Web App URL into `apiEndpoint` in `srirayong/shared/campaignConfig.js`.

When `apiEndpoint` is empty, real claim/admin actions are blocked so staff do not accidentally use browser-only test data. Add `?demo` to a route for local demo mode, for example `/srirayong/claim/?demo`.

## Local Preview

Double-click `open-webapp.cmd`, or run this command from this folder:

```powershell
C:\Users\ADMIN\.cache\codex-runtimes\codex-primary-runtime\dependencies\python\python.exe -m http.server 4175 --bind 127.0.0.1
```

Then open:

- `http://127.0.0.1:4175/srirayong/`
- `http://127.0.0.1:4175/srirayong/claim/`
- `http://127.0.0.1:4175/srirayong/admin/`
- `http://127.0.0.1:4175/srirayong/config/`

## Coupon Status Source Of Truth

The coupon image is only customer-facing proof. Real authorization comes from the Google Sheet:

- `ISSUED`: usable when not expired
- `REDEEMED`: already used
- `EXPIRED`: expired by status or expiration date
- `VOID`: manually cancelled

Staff should use `/srirayong/admin/` before allowing redemption. The admin page checks the database status, not only the text printed on the coupon image.
