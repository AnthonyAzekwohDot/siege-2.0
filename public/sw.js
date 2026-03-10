// Siege 2.0 — Push Notification Service Worker

const APP_ICON = "/icon-192.png";
const APP_BADGE = "/icon-192.png";

// URL mapping for notification types
const TYPE_URLS = {
  "weigh-in": "/progress",
  meal: "/nutrition",
  water: "/",
  workout: "/schedule",
  "tonight-lock": "/",
  default: "/",
};

// Handle incoming push events
self.addEventListener("push", (event) => {
  if (!event.data) return;

  let payload;
  try {
    payload = event.data.json();
  } catch {
    payload = {
      title: "Siege",
      body: event.data.text(),
      type: "default",
      url: "/",
    };
  }

  const title = payload.title || "Siege";
  const options = {
    body: payload.body || "",
    icon: APP_ICON,
    badge: APP_BADGE,
    tag: payload.type || "default",
    data: {
      url: payload.url || TYPE_URLS[payload.type] || "/",
      type: payload.type || "default",
    },
    vibrate: [100, 50, 100],
    renotify: true,
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

// Handle notification clicks
self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const url = event.notification.data?.url || "/";

  event.waitUntil(
    clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((clientList) => {
        // If a window is already open, focus it and navigate
        for (const client of clientList) {
          if ("focus" in client) {
            client.focus();
            client.navigate(url);
            return;
          }
        }
        // Otherwise open a new window
        return clients.openWindow(url);
      })
  );
});

// Activate immediately
self.addEventListener("activate", (event) => {
  event.waitUntil(clients.claim());
});
