export function getCookie(name: string): string {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop()?.split(';').shift() || '';
  return '';
}

export function setCookie(name: string, value: string | number): void {
  document.cookie = `${name}=${value}; path=/`;
} 