const DEFAULT_PUBLIC_SITE_URL = 'https://aixevents.datawhale.cn';

type ViteLikeEnv = {
  VITE_PUBLIC_SITE_URL?: string;
};

function getViteEnv(): ViteLikeEnv {
  return ((import.meta as ImportMeta & { env?: ViteLikeEnv }).env || {}) as ViteLikeEnv;
}

function isLocalOrigin(origin: string): boolean {
  return /^https?:\/\/(localhost|127\.0\.0\.1|\[::1\])(?::\d+)?$/i.test(origin);
}

export function getPublicSiteUrl(): string {
  const configuredUrl = getViteEnv().VITE_PUBLIC_SITE_URL?.trim();
  const runtimeOrigin = typeof window !== 'undefined' ? window.location.origin : '';
  const siteUrl = configuredUrl || (!isLocalOrigin(runtimeOrigin) && runtimeOrigin) || DEFAULT_PUBLIC_SITE_URL;

  return siteUrl.replace(/\/+$/, '');
}
