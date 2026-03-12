import { useEffect, useRef } from 'react';

interface Props {
  checkoutFormContent: string;
  onClose: () => void;
}

/**
 * İyzico Checkout Form'u güvenli bir iframe içinde gösterir.
 * İyzico'nun embed kodu (checkoutFormContent) doğrudan sayfaya eklenirse
 * kendi script tag'lerini çalıştırır ve ödeme formunu render eder.
 */
export default function IyzicoCheckoutModal({ checkoutFormContent, onClose }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || !checkoutFormContent) return;

    // İyzico'nun script içeren HTML'ini güvenli şekilde yerleştir
    const range = document.createRange();
    range.selectNode(container);
    const fragment = range.createContextualFragment(checkoutFormContent);
    container.innerHTML = '';
    container.appendChild(fragment);

    // ESC ile kapat
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [checkoutFormContent, onClose]);

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col">
        {/* Modal Başlık */}
        <div className="flex items-center justify-between px-5 py-3 border-b">
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
            </svg>
            <span className="font-semibold text-sm">Güvenli Ödeme</span>
          </div>
          <div className="flex items-center gap-3">
            {/* SSL güven rozeti */}
            <span className="text-[10px] text-green-600 font-medium flex items-center gap-0.5">
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
              </svg>
              SSL Korumalı
            </span>
            <button
              onClick={onClose}
              className="text-muted-foreground hover:text-foreground transition-colors text-lg leading-none"
            >
              ✕
            </button>
          </div>
        </div>

        {/* İyzico Form Container */}
        <div className="flex-1 overflow-auto p-4">
          <div ref={containerRef} id="iyzipay-checkout-form" className="popup" />
        </div>

        {/* Alt bilgi */}
        <div className="px-5 py-2.5 border-t bg-muted/30 flex items-center justify-between">
          <p className="text-[10px] text-muted-foreground">
            Ödeme işlemi İyzico güvencesiyle gerçekleştirilmektedir.
          </p>
          <img
            src="https://www.iyzico.com/assets/images/logo/iyzico-logo.png"
            alt="İyzico"
            className="h-4 opacity-60"
            onError={(e) => (e.currentTarget.style.display = 'none')}
          />
        </div>
      </div>
    </div>
  );
}
