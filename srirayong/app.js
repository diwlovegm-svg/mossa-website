import { mountInstallButton, registerPwa, renderRuntimeStatus } from './shared/pwa.js';

registerPwa();
mountInstallButton(document.querySelector('#installApp'));
renderRuntimeStatus(document.querySelector('#runtimeStatus'));
