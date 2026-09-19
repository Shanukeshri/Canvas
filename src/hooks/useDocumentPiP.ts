import { useState, useCallback, useEffect } from 'react';

export function useDocumentPiP() {
  const [pipWindow, setPipWindow] = useState<Window | null>(null);

  const requestPiP = useCallback(async (options: { width: number; height: number }) => {
    if (!('documentPictureInPicture' in window)) {
      console.warn('Document Picture-in-Picture is not supported in this browser.');
      return;
    }

    try {
      // Request the PiP window
      const pip = await (window as any).documentPictureInPicture.requestWindow(options);
      
      // Copy styles from the main window to the PiP window
      const copyStyles = () => {
        // Copy standard stylesheets
        const styleSheets = Array.from(document.styleSheets);
        styleSheets.forEach((styleSheet) => {
          try {
            if (styleSheet.href) {
              const link = document.createElement('link');
              link.rel = 'stylesheet';
              link.href = styleSheet.href;
              pip.document.head.appendChild(link);
            } else if (styleSheet.cssRules) {
              const style = document.createElement('style');
              Array.from(styleSheet.cssRules).forEach((rule) => {
                style.appendChild(document.createTextNode(rule.cssText));
              });
              pip.document.head.appendChild(style);
            }
          } catch (e) {
            console.warn('Could not copy stylesheet', e);
          }
        });
        
        // Also explicitly copy any raw style or link tags from head (for Tailwind, Next.js injections)
        document.head.querySelectorAll('style, link[rel="stylesheet"]').forEach(node => {
          pip.document.head.appendChild(node.cloneNode(true));
        });
      };

      copyStyles();

      // Initial sync of all attributes (classes, data-themes, inline styles) for accurate theme copying
      Array.from(document.documentElement.attributes).forEach(attr => {
        pip.document.documentElement.setAttribute(attr.name, attr.value);
      });
      Array.from(document.body.attributes).forEach(attr => {
        pip.document.body.setAttribute(attr.name, attr.value);
      });
      pip.document.body.classList.add('bg-surface'); // Ensure theme background applies

      // Apply base styles to body for layout
      pip.document.body.style.margin = '0';
      pip.document.body.style.width = '100vw';
      pip.document.body.style.height = '100vh';
      pip.document.body.style.overflow = 'hidden';
      pip.document.body.style.display = 'flex';
      pip.document.body.style.alignItems = 'center';
      pip.document.body.style.justifyContent = 'center';

      // Set up a MutationObserver to sync theme changes (all attributes) in real-time
      const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
          if (mutation.type === 'attributes' && mutation.attributeName) {
            const target = mutation.target as HTMLElement;
            const pipTarget = target === document.documentElement ? pip.document.documentElement : 
                              target === document.body ? pip.document.body : null;
            
            if (pipTarget) {
              const newValue = target.getAttribute(mutation.attributeName);
              if (newValue !== null) {
                pipTarget.setAttribute(mutation.attributeName, newValue);
              } else {
                pipTarget.removeAttribute(mutation.attributeName);
              }
              
              // Ensure our base background class remains on the body
              if (target === document.body && mutation.attributeName === 'class') {
                pipTarget.classList.add('bg-surface');
              }
            }
          }
        });
      });

      observer.observe(document.documentElement, { attributes: true });
      observer.observe(document.body, { attributes: true });

      // Listen for the PiP window closing
      pip.addEventListener('pagehide', () => {
        observer.disconnect();
        setPipWindow(null);
      });

      setPipWindow(pip);
    } catch (error) {
      console.error('Failed to open PiP window:', error);
    }
  }, []);

  const closePiP = useCallback(() => {
    if (pipWindow) {
      pipWindow.close();
      setPipWindow(null);
    }
  }, [pipWindow]);

  // Clean up if the main window closes
  useEffect(() => {
    return () => {
      if (pipWindow) {
        pipWindow.close();
      }
    };
  }, [pipWindow]);

  return { pipWindow, requestPiP, closePiP };
}
