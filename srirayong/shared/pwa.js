import { getRuntimeMode } from './apiClient.js';

let deferredInstallPrompt = null;
let refreshedForServiceWorker = false;
const installButtons = new Set();

window.addEventListener('beforeinstallprompt', (event) => {
  event.preventDefault();
  deferredInstallPrompt = event;
  updateInstallButtons();
});

window.addEventListener('appinstalled', () => {
  deferredInstallPrompt = null;
  updateInstallButtons();
});

export function registerPwa() {
  if (!('serviceWorker' in navigator)) return;

  const swUrl = new URL('../sw.js', import.meta.url);
  const scopeUrl = new URL('../', import.meta.url);
  navigator.serviceWorker.register(swUrl, { scope: scopeUrl.pathname })
    .then((registration) => {
      registration.update().catch(() => {});
      if (registration.waiting) {
        registration.waiting.postMessage({ type: 'SKIP_WAITING' });
      }
    })
    .catch(() => {});

  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (refreshedForServiceWorker) return;
    refreshedForServiceWorker = true;
    window.location.reload();
  });
}

export function mountInstallButton(button) {
  if (!button) return;

  installButtons.add(button);
  button.addEventListener('click', async () => {
    if (!deferredInstallPrompt) return;

    deferredInstallPrompt.prompt();
    await deferredInstallPrompt.userChoice;
    deferredInstallPrompt = null;
    updateInstallButtons();
  });

  updateInstallButtons();
}

export function renderRuntimeStatus(element) {
  if (!element) return;

  const mode = getRuntimeMode();
  const labels = {
    live: 'พร้อมใช้จริง',
    demo: 'โหมดทดสอบบนเครื่องนี้',
    setup: 'รอเชื่อม Apps Script',
  };

  element.textContent = labels[mode] || labels.setup;
  element.dataset.mode = mode;
}

function updateInstallButtons() {
  const canInstall = Boolean(deferredInstallPrompt);
  installButtons.forEach((button) => {
    button.hidden = !canInstall;
  });
}
