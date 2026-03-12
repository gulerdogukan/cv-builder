import { useEffect } from 'react';

interface SEOOptions {
  title?: string;
  description?: string;
  canonical?: string;
  noIndex?: boolean;
}

const BASE_TITLE = 'CV Builder';
const BASE_DESCRIPTION =
  'Yapay zeka destekli CV oluşturucu ile dakikalar içinde ATS uyumlu, profesyonel özgeçmişinizi hazırlayın.';

/**
 * Sayfa başlığını ve meta description'ını dinamik olarak günceller.
 * Her sayfa bileşeninin başında çağrılabilir.
 */
export function useSEO({ title, description, canonical, noIndex }: SEOOptions = {}) {
  useEffect(() => {
    // Başlık
    document.title = title ? `${title} | ${BASE_TITLE}` : `${BASE_TITLE} — Ücretsiz AI Destekli, ATS Uyumlu CV Oluşturucu`;

    // Description
    const desc = description ?? BASE_DESCRIPTION;
    setMeta('name', 'description', desc);
    setMeta('property', 'og:description', desc);
    setMeta('name', 'twitter:description', desc);

    // OG title
    setMeta('property', 'og:title', title ? `${title} | ${BASE_TITLE}` : `${BASE_TITLE} — Ücretsiz AI Destekli CV Oluşturucu`);

    // Canonical
    if (canonical) {
      let link = document.querySelector<HTMLLinkElement>('link[rel="canonical"]');
      if (!link) {
        link = document.createElement('link');
        link.rel = 'canonical';
        document.head.appendChild(link);
      }
      link.href = canonical;
    }

    // Robots
    if (noIndex) {
      setMeta('name', 'robots', 'noindex, nofollow');
    }

    // Cleanup: sayfa değişince orijinal description'a dön isteyebilirsiniz
    return () => {
      document.title = `${BASE_TITLE} — Ücretsiz AI Destekli, ATS Uyumlu CV Oluşturucu`;
    };
  }, [title, description, canonical, noIndex]);
}

function setMeta(attrName: 'name' | 'property', attrValue: string, content: string) {
  let el = document.querySelector<HTMLMetaElement>(`meta[${attrName}="${attrValue}"]`);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attrName, attrValue);
    document.head.appendChild(el);
  }
  el.content = content;
}
