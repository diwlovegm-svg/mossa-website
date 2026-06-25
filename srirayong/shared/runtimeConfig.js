import { campaignConfig as defaultCampaignConfig } from './campaignConfig.js';
import { couponTemplate as defaultCouponTemplate } from './couponTemplate.js';

let runtimeCampaignConfig = clone(defaultCampaignConfig);
let runtimeCouponTemplate = clone(defaultCouponTemplate);

export function getCampaignConfig() {
  return runtimeCampaignConfig;
}

export function getCouponTemplate() {
  return runtimeCouponTemplate;
}

export function getCouponSettings() {
  return {
    campaign: clone(runtimeCampaignConfig),
    template: clone(runtimeCouponTemplate),
  };
}

export function applyCouponSettings(settings = {}) {
  runtimeCampaignConfig = mergeDeep(clone(defaultCampaignConfig), settings.campaign || {});
  runtimeCouponTemplate = mergeDeep(clone(defaultCouponTemplate), settings.template || {});
  return getCouponSettings();
}

export function resetCouponSettings() {
  runtimeCampaignConfig = clone(defaultCampaignConfig);
  runtimeCouponTemplate = clone(defaultCouponTemplate);
  return getCouponSettings();
}

function mergeDeep(base, override) {
  for (const [key, value] of Object.entries(override || {})) {
    if (Array.isArray(value)) {
      base[key] = [...value];
    } else if (value && typeof value === 'object') {
      base[key] = mergeDeep(base[key] && typeof base[key] === 'object' ? base[key] : {}, value);
    } else if (value !== undefined) {
      base[key] = value;
    }
  }
  return base;
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}
