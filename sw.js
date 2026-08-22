const CACHE_NAME = "digital-timer-v1";

const FILES_TO_CACHE = [
    "./",
    "./index.html",
    "./style.css",
    "./script.js",
    "./manifest.json",
    "./icons/icon-192.png",
    "./icons/icon-512.png"
];


/* =========================
   インストール
========================= */

self.addEventListener("install", event => {

    event.waitUntil(

        caches.open(CACHE_NAME)
            .then(cache => {

                return cache.addAll(FILES_TO_CACHE);

            })

    );

    self.skipWaiting();

});


/* =========================
   有効化
========================= */

self.addEventListener("activate", event => {

    event.waitUntil(

        caches.keys().then(cacheNames => {

            return Promise.all(

                cacheNames
                    .filter(name => name !== CACHE_NAME)
                    .map(name => caches.delete(name))

            );

        })

    );

    self.clients.claim();

});


/* =========================
   ファイルを読み込む
========================= */

self.addEventListener("fetch", event => {

    event.respondWith(

        caches.match(event.request)
            .then(response => {

                // キャッシュがあれば使用
                if (response) {
                    return response;
                }

                // なければインターネットから取得
                return fetch(event.request);

            })

    );

});