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

      // Apply base styles to body
      pip.document.body.className = document.body.className; // copy tailwind classes if any
      pip.document.body.style.backgroundColor = getComputedStyle(document.body).backgroundColor;
      pip.document.body.style.color = getComputedStyle(document.body).color;
      pip.document.body.style.margin = '0';
      pip.document.body.style.width = '100vw';
      pip.document.body.style.height = '100vh';
      pip.document.body.style.overflow = 'hidden';
      pip.document.body.style.display = 'flex';
      pip.document.body.style.alignItems = 'center';
      pip.document.body.style.justifyContent = 'center';

      // Listen for the PiP window closing
      pip.addEventListener('pagehide', () => {
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
