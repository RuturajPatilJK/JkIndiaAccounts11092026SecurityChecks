// Shared axios interceptor logic for cookie-based auth. Used both by the global
// `axios` default instance (covers every raw `axios.get/post(...)` call in the app)
// and by `axiosInstance.jsx`, since axios.create() instances don't inherit
// interceptors registered on the default instance.

export function getCookie(name) {
  const match = document.cookie.match(new RegExp('(?:^|; )' + name + '=([^;]*)'));
  return match ? decodeURIComponent(match[1]) : null;
}

// Shared across all requests on this instance so N simultaneous 401s trigger one
// refresh call (not N), and a failed refresh redirects once (not N times).
function makeRefreshState() {
  return { promise: null, redirected: false };
}

export function attachAuthInterceptors(instance, refreshUrl) {
  const refreshState = makeRefreshState();

  instance.interceptors.request.use((config) => {
    const method = (config.method || 'get').toLowerCase();
    if (method !== 'get' && method !== 'head' && method !== 'options') {
      // /refresh runs against the refresh-token cookie, so its CSRF check reads
      // csrf_refresh_token; every other mutating request runs against the access
      // token, so it reads csrf_access_token.
      const isRefreshCall = config.url === refreshUrl;
      const csrfToken = getCookie(isRefreshCall ? 'csrf_refresh_token' : 'csrf_access_token');
      if (csrfToken) {
        config.headers = config.headers || {};
        config.headers['X-CSRF-TOKEN'] = csrfToken;
      }
    }
    return config;
  });

  instance.interceptors.response.use(
    (response) => response,
    async (error) => {
      const { config, response } = error;

      // A 401 with no active session (nothing logged in yet, or already logged out)
      // is expected, not a session that needs refreshing - e.g. components that fetch
      // on mount regardless of auth state. Trying to refresh/redirect for those would
      // just reload the page into the exact same unauthenticated state, forever.
      const hasSession = !!sessionStorage.getItem('username');

      if (
        !response ||
        response.status !== 401 ||
        !config ||
        config._retry ||
        config.url === refreshUrl ||
        (typeof config.url === 'string' && config.url.includes('/login')) ||
        !hasSession
      ) {
        return Promise.reject(error);
      }

      config._retry = true;

      if (!refreshState.promise) {
        refreshState.promise = instance
          .post(refreshUrl)
          .catch((refreshError) => {
            if (!refreshState.redirected) {
              refreshState.redirected = true;
              sessionStorage.clear();
              window.location.href = '/';
            }
            throw refreshError;
          })
          .finally(() => {
            refreshState.promise = null;
          });
      }

      try {
        await refreshState.promise;
        return instance(config);
      } catch (refreshError) {
        return Promise.reject(refreshError);
      }
    }
  );
}

// ~80 files call the raw `fetch()` API directly instead of axios. Unlike axios (which
// we defaulted to withCredentials: true), fetch() does not send cookies cross-origin
// unless each call explicitly opts in, so those calls were silently getting 401s once
// the backend started requiring the auth cookie on every route. Patch the global
// fetch once here (same "one place, no call-site edits" approach as setupGlobalAxios)
// instead of touching all 80+ files: default credentials to 'include', and attach the
// CSRF header for mutating requests, same as the axios interceptor does.
export function patchGlobalFetch() {
  if (window.fetch.__authPatched) return;

  const originalFetch = window.fetch.bind(window);

  const patchedFetch = (input, init = {}) => {
    const method = (init.method || (input && input.method) || 'GET').toUpperCase();
    const finalInit = { credentials: 'include', ...init };

    if (method !== 'GET' && method !== 'HEAD' && method !== 'OPTIONS') {
      const csrfToken = getCookie('csrf_access_token');
      if (csrfToken) {
        finalInit.headers = new Headers(init.headers || {});
        finalInit.headers.set('X-CSRF-TOKEN', csrfToken);
      }
    }

    return originalFetch(input, finalInit);
  };
  patchedFetch.__authPatched = true;

  window.fetch = patchedFetch;
}
