// Bolt UPSC - Offline Service Worker
const CACHE_NAME = "bolt-upsc-shell-v2";
const DATA_CACHE_NAME = "bolt-upsc-data-v1";

const PRECACHE_ASSETS = [
  "/",
  "/index.html",
  "/manifest.json",
  "/icon.svg",
  "/icon-maskable.svg"
];

// Install Event: precache core shell assets
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => {
        console.log("[ServiceWorker] Precaching app shell");
        return cache.addAll(PRECACHE_ASSETS);
      })
      .then(() => self.skipWaiting())
      .catch((err) => {
        console.warn("[ServiceWorker] Precache failed, continuing:", err);
      })
  );
});

// Activate Event: prune old caches and claim clients
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keyList) => {
        return Promise.all(
          keyList.map((key) => {
            if (key !== CACHE_NAME && key !== DATA_CACHE_NAME) {
              console.log("[ServiceWorker] Removing old cache:", key);
              return caches.delete(key);
            }
          })
        );
      })
      .then(() => self.clients.claim())
  );
});

// Helper to check if request is for syllabus or timetable
function isSyllabusOrTimetableRequest(url) {
  return (
    url.pathname.includes("/api/syllabus") ||
    url.pathname.includes("/api/timetable") ||
    url.pathname.endsWith("/syllabus.json") ||
    url.pathname.endsWith("/timetable.json")
  );
}

// Fetch Event
self.addEventListener("fetch", (event) => {
  const request = event.request;
  const url = new URL(request.url);

  // Only handle HTTP/HTTPS GET requests
  if (request.method !== "GET" || !url.protocol.startsWith("http")) {
    return;
  }

  // Strategy A: Syllabus and Timetable APIs (Network First with Data Cache Fallback)
  if (isSyllabusOrTimetableRequest(url)) {
    event.respondWith(
      fetch(request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const copy = networkResponse.clone();
            caches.open(DATA_CACHE_NAME).then((cache) => {
              cache.put(request, copy);
            });
          }
          return networkResponse;
        })
        .catch(async () => {
          console.log("[ServiceWorker] Network failed for data request; checking cache:", url.pathname);
          const cachedResponse = await caches.match(request);
          if (cachedResponse) {
            return cachedResponse;
          }
          // Synthetic fallback if nothing cached yet
          return new Response(JSON.stringify({ offline: true, data: [] }), {
            status: 200,
            headers: { "Content-Type": "application/json", "X-Bolt-Offline": "true" },
          });
        })
    );
    return;
  }

  // Strategy B: Navigation (HTML document requests)
  if (request.mode === "navigate" || request.headers.get("accept")?.includes("text/html")) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response.status === 200) {
            const copy = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
          }
          return response;
        })
        .catch(async () => {
          const cachedPage = await caches.match(request);
          if (cachedPage) return cachedPage;
          const fallbackIndex = await caches.match("/index.html");
          if (fallbackIndex) return fallbackIndex;
          const rootFallback = await caches.match("/");
          if (rootFallback) return rootFallback;
          return new Response("Offline - Bolt UPSC Civil Services Platform is ready offline.", {
            status: 200,
            headers: { "Content-Type": "text/html" },
          });
        })
    );
    return;
  }

  // Strategy C: Google Fonts and Web Fonts (Cache First)
  if (url.origin.includes("fonts.googleapis.com") || url.origin.includes("fonts.gstatic.com")) {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) return cached;
        return fetch(request).then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const copy = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
          }
          return networkResponse;
        });
      })
    );
    return;
  }

  // Strategy D: Static Assets (JS, CSS, SVGs, Images) - Stale While Revalidate
  if (
    url.pathname.match(/\.(js|css|svg|png|jpg|jpeg|webp|ico|woff2?|json)$/i) ||
    url.pathname.startsWith("/@") ||
    url.pathname.startsWith("/src/") ||
    url.pathname.startsWith("/assets/")
  ) {
    event.respondWith(
      caches.match(request).then((cached) => {
        const fetchPromise = fetch(request)
          .then((networkResponse) => {
            if (networkResponse && networkResponse.status === 200) {
              const copy = networkResponse.clone();
              caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
            }
            return networkResponse;
          })
          .catch(() => cached);

        return cached || fetchPromise;
      })
    );
    return;
  }

  // Default: Network with Cache Fallback
  event.respondWith(
    fetch(request).catch(() => {
      return caches.match(request);
    })
  );
});

// Message Event: Sync syllabus & timetable directly into CacheStorage or force skip waiting
self.addEventListener("message", (event) => {
  if (!event.data) return;

  if (event.data.type === "SKIP_WAITING") {
    self.skipWaiting();
  }

  if (event.data.type === "CACHE_OFFLINE_DATA") {
    const { syllabus, timetable, timestamp } = event.data;
    caches.open(DATA_CACHE_NAME).then((cache) => {
      if (syllabus) {
        const syllabusResponse = new Response(JSON.stringify(syllabus), {
          headers: {
            "Content-Type": "application/json",
            "X-Bolt-Cached-At": timestamp || new Date().toISOString(),
          },
        });
        cache.put("/api/syllabus", syllabusResponse);
      }

      if (timetable) {
        const timetableResponse = new Response(JSON.stringify(timetable), {
          headers: {
            "Content-Type": "application/json",
            "X-Bolt-Cached-At": timestamp || new Date().toISOString(),
          },
        });
        cache.put("/api/timetable", timetableResponse);
      }
      console.log("[ServiceWorker] Successfully cached syllabus and timetable in CacheStorage");
    });
  }
});
