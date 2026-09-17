/* English GK AI CORS fallback
   Routes browser calls to router.bynara.id through CorsProxy because the
   provider currently does not return browser CORS headers. The API key is
   still supplied only from the browser and is NOT stored in this file.
*/
(function () {
  'use strict';
  if (window.__englishGKCorsFixInstalled) return;
  window.__englishGKCorsFixInstalled = true;

  const PROXY = 'https://corsproxy.io/?url=';
  const TARGET = /(^|\.)router\.bynara\.id$/i;

  function shouldProxy(url) {
    try {
      return TARGET.test(new URL(String(url), location.href).hostname);
    } catch (_) {
      return false;
    }
  }

  function proxied(url) {
    return PROXY + encodeURIComponent(String(url));
  }

  // Fetch-based AI clients.
  const nativeFetch = window.fetch.bind(window);
  window.fetch = function (input, init) {
    let url = '';
    try { url = typeof input === 'string' ? input : input.url; } catch (_) {}
    if (url && shouldProxy(url)) {
      if (input instanceof Request) {
        input = new Request(proxied(input.url), input);
      } else {
        input = proxied(url);
      }
    }
    return nativeFetch(input, init);
  };

  // XMLHttpRequest-based AI clients / connection testers.
  const nativeOpen = XMLHttpRequest.prototype.open;
  XMLHttpRequest.prototype.open = function (method, url, ...rest) {
    if (shouldProxy(url)) url = proxied(url);
    return nativeOpen.call(this, method, url, ...rest);
  };

  console.info('[English GK] AI CORS fallback enabled for router.bynara.id');
})();
