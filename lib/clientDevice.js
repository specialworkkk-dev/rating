// Browser-side copy of the device ID, so clearing cookies alone doesn't reset it.
const KEY = "rb_device_id";

export function getStoredDeviceId() {
  try {
    return localStorage.getItem(KEY) || undefined;
  } catch {
    return undefined;
  }
}

export function storeDeviceId(id) {
  try {
    if (id) localStorage.setItem(KEY, id);
  } catch {}
}
