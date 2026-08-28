const HOST_ID = 'wm-lib-version-host';
document.getElementById(HOST_ID)?.remove();
document.getElementById('wm-lib-version-panel')?.remove();

const LIST_KEY = 'wm_libVersionList_v1';
const STATUS_KEY = 'wm_libVersionStatus_v1';
const GITLAB_PROJECT_URL = 'https://gitlab.walkmernd.com/walkme/engine/player/player/';
const GITLAB_COMMIT_URL = 'https://gitlab.walkmernd.com/walkme/engine/player/player/-/commit/';

let versions = null;
try { versions = JSON.parse(localStorage.getItem(LIST_KEY)); } catch {}

const loadStatus = () => { try { return JSON.parse(localStorage.getItem(STATUS_KEY)) || {}; } catch { return {}; } };
const saveStatus = (s) => localStorage.setItem(STATUS_KEY, JSON.stringify(s));
let status = loadStatus();
