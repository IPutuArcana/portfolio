export type Lang = 'id' | 'en';

export function resolvedTheme(): 'light' | 'dark' {
  const attr = document.documentElement.getAttribute('data-theme');
  if (attr === 'light' || attr === 'dark') return attr;
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

export function currentLang(): Lang {
  const attr = document.documentElement.getAttribute('lang');
  return attr === 'en' ? 'en' : 'id';
}

export function applyLang(lang: Lang): void {
  document.documentElement.setAttribute('lang', lang);
  document.querySelectorAll<HTMLElement>('[data-i18n-id]').forEach((el) => {
    const value = lang === 'id' ? el.dataset.i18nId : el.dataset.i18nEn;
    if (value == null) return;
    const attr = el.dataset.i18nAttr;
    if (attr) {
      el.setAttribute(attr, value);
    } else {
      el.textContent = value;
    }
  });
}
