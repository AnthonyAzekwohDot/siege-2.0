// Siege 2.0 — Service Worker (Push + Offline Cache)

const CACHE_NAME = "siege-v2";
const APP_ICON = "/icon-192.png";
const APP_BADGE = "/icon-192.png";

// App shell files to pre-cache
const APP_SHELL = [
  "/",
  "/schedule",
  "/nutrition",
  "/mind",
  "/progress",
  "/settings",
  "/icon-192.png",
  "/icon-512.png",
  "/apple-touch-icon.png",
];

// URL mapping for notification types
const TYPE_URLS = {
  "weigh-in": "/progress",
  meal: "/nutrition",
  water: "/",
  workout: "/schedule",
  "tonight-lock": "/",
  default: "/",
};

// ============ Install: pre-cache app shell ============

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL))
  );
  self.skipWaiting();
});

// ============ Activate: clean old caches ============

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key !== CACHE_NAME)
            .map((key) => caches.delete(key))
        )
      )
      .then(() => clients.claim())
  );
});

// ============ Fetch: network-first with cache fallback ============

self.addEventListener("fetch", (event) => {
  const { request } = event;

  // Skip non-GET and API/analytics requests
  if (
    request.method !== "GET" ||
    request.url.includes("/api/") ||
    request.url.includes("supabase") ||
    request.url.includes("analytics")
  ) {
    return;
  }

  event.respondWith(
    fetch(request)
      .then((response) => {
        // Cache successful responses
        if (response.ok) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
        }
        return response;
      })
      .catch(() => {
        // Offline: serve from cache
        return caches.match(request).then((cached) => {
          if (cached) return cached;
          // For navigation requests, serve the cached home page as fallback
          if (request.mode === "navigate") {
            return caches.match("/");
          }
          return new Response("Offline", { status: 503 });
        });
      })
  );
});

// ============ Push notifications ============

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

// ============ Notification clicks ============

self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const url = event.notification.data?.url || "/";

  event.waitUntil(
    clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((clientList) => {
        for (const client of clientList) {
          if ("focus" in client) {
            client.focus();
            client.navigate(url);
            return;
          }
        }
        return clients.openWindow(url);
      })
  );
});
