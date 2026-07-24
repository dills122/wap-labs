const base = import.meta.env.BASE_URL.replace(/\/$/, '');

export function route(path = ''): string {
  const normalized = path.replace(/^\/+/, '');
  return normalized ? `${base}/${normalized}` : `${base}/`;
}

export function slugifyId(id: string): string {
  return encodeURIComponent(id);
}
