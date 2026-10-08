import { useEffect } from 'react';

const DARK = '#020617'; // slate-950: top and bottom of the dark gradient

// Safari paints the page background behind its top/bottom bars and when you
// overscroll, so a dark full-screen page needs a dark document background too.
export function useDarkDocument(): void {
  useEffect(() => {
    const html = document.documentElement;
    const body = document.body;
    const prevHtml = html.style.backgroundColor;
    const prevBody = body.style.backgroundColor;
    html.style.backgroundColor = DARK;
    body.style.backgroundColor = DARK;

    let meta = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]');
    const created = !meta;
    if (!meta) {
      meta = document.createElement('meta');
      meta.name = 'theme-color';
      document.head.appendChild(meta);
    }
    const prevTheme = meta.content;
    meta.content = DARK;

    return () => {
      html.style.backgroundColor = prevHtml;
      body.style.backgroundColor = prevBody;
      if (created) meta.remove();
      else meta.content = prevTheme;
    };
  }, []);
}
