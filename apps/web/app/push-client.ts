const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3101/api";

function vapidKey(value: string) {
  const padding = "=".repeat((4 - value.length % 4) % 4);
  const base64 = (value + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64);
  return Uint8Array.from(raw, (character) => character.charCodeAt(0));
}

export async function enablePushNotifications(token: string) {
  if (!("serviceWorker" in navigator) || !("PushManager" in window) || !("Notification" in window)) throw Error("Este navegador não oferece notificações push.");
  const permission = await Notification.requestPermission();
  if (permission !== "granted") throw Error("Permissão de notificações não foi concedida. Ative-a nas configurações do navegador.");
  const configResponse = await fetch(`${API}/push/public-key`, { headers: { authorization: `Bearer ${token}` } });
  const config = await configResponse.json();
  if (!configResponse.ok || !config.enabled || !config.publicKey) throw Error(config.message ?? "Notificações no celular ainda não estão configuradas no servidor.");
  const registration = await navigator.serviceWorker.register("/push-worker.js");
  const subscription = await registration.pushManager.getSubscription() ?? await registration.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: vapidKey(config.publicKey) });
  const json = subscription.toJSON();
  const response = await fetch(`${API}/push/subscribe`, { method: "POST", headers: { authorization: `Bearer ${token}`, "content-type": "application/json" }, body: JSON.stringify({ endpoint: json.endpoint, p256dh: json.keys?.p256dh, auth: json.keys?.auth }) });
  const result = await response.json().catch(() => ({}));
  if (!response.ok || !result.enabled) throw Error(result.message ?? "Não foi possível ativar as notificações no celular.");
  localStorage.setItem("varejo-push-enabled", "true");
  const testResponse = await fetch(`${API}/push/test`, { method: "POST", headers: { authorization: `Bearer ${token}` } });
  if (!testResponse.ok) throw Error("Notificações ativadas, mas não foi possível enviar o teste.");
}

export function hasPushNotifications() { return localStorage.getItem("varejo-push-enabled") === "true"; }
