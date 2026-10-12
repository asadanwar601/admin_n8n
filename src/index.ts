import { AdminRagConfig } from './types';
import { AdminRagWidget, createAdminRag } from './widget';

export * from './types';
export * from './widget';

declare global {
  interface Window {
    createAdminRag?: typeof createAdminRag;
    N8nAdminWidget?: {
      createAdminRag: typeof createAdminRag;
      AdminRagWidget: typeof AdminRagWidget;
    };
  }
}

if (typeof window !== 'undefined') {
  window.createAdminRag = createAdminRag;
  window.N8nAdminWidget = {
    createAdminRag,
    AdminRagWidget,
  };

  // Auto-mount if script tag includes data-api-url:
  // <script src="admin-widget.bundle.js" data-api-url="https://..." data-target="#admin-rag-portal"></script>
  const currentScript =
    document.currentScript ||
    document.querySelector('script[data-api-url], script[data-admin-api-url]');

  if (currentScript) {
    const apiUrl =
      currentScript.getAttribute('data-api-url') ||
      currentScript.getAttribute('data-admin-api-url');
    if (apiUrl) {
      const config: AdminRagConfig = {
        apiUrl,
        target: currentScript.getAttribute('data-target') || undefined,
        mode: (currentScript.getAttribute('data-mode') as any) || undefined,
        botId: currentScript.getAttribute('data-bot-id') || undefined,
        title: currentScript.getAttribute('data-title') || undefined,
        subtitle: currentScript.getAttribute('data-subtitle') || undefined,
        primaryColor: currentScript.getAttribute('data-primary-color') || undefined,
        position: (currentScript.getAttribute('data-position') as any) || undefined,
        adminUsername: currentScript.getAttribute('data-admin-username') || undefined,
        adminPassword: currentScript.getAttribute('data-admin-password') || undefined,
      };

      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => createAdminRag(config));
      } else {
        createAdminRag(config);
      }
    }
  }
}
