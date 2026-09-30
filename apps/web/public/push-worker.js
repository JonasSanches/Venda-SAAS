self.addEventListener("push", (event) => {
  const data = event.data ? event.data.json() : {};
  event.waitUntil(self.registration.showNotification(data.title || "Venda+", {
    body: data.body || "Você tem uma nova atualização.",
    icon: "/icon.svg",
    badge: "/icon.svg",
    tag: data.tag,
    data: { url: data.url || "/" },
  }));
});
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  event.waitUntil(clients.openWindow(event.notification.data?.url || "/"));
});
