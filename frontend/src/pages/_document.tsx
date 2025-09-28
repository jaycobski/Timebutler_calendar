/**
 * Custom Document - TimeButler Calendar MVP
 * Optimizes HTML document structure for performance and accessibility
 */

import { Html, Head, Main, NextScript } from 'next/document';

/**
 * Custom Document Component
 * Handles server-side HTML generation with optimization
 */
export default function Document() {
  return (
    <Html className="h-full scroll-smooth">
      <Head>
        {/* Critical performance optimizations */}
        <meta httpEquiv="x-dns-prefetch-control" content="on" />

        {/* Preload critical fonts for performance */}
        <link
          rel="preload"
          href="/fonts/Inter-Variable.woff2"
          as="font"
          type="font/woff2"
          crossOrigin=""
        />

        {/* Critical CSS for above-the-fold content */}
        <style
          dangerouslySetInnerHTML={{
            __html: `
              /* Critical styles for initial render */
              *,*::before,*::after{box-sizing:border-box}
              *{margin:0}
              html,body{height:100%}
              body{line-height:1.5;-webkit-font-smoothing:antialiased}
              img,picture,video,canvas,svg{display:block;max-width:100%}
              input,button,textarea,select{font:inherit}
              p,h1,h2,h3,h4,h5,h6{overflow-wrap:break-word}
              #__next{isolation:isolate}

              /* Loading state */
              .loading-screen{
                position:fixed;
                top:0;
                left:0;
                width:100%;
                height:100%;
                background:#fff;
                display:flex;
                align-items:center;
                justify-content:center;
                z-index:9999;
              }

              /* Skip link critical styles */
              .skip-nav:not(:focus){
                position:absolute !important;
                width:1px !important;
                height:1px !important;
                padding:0 !important;
                margin:-1px !important;
                overflow:hidden !important;
                clip:rect(0,0,0,0) !important;
                white-space:nowrap !important;
                border:0 !important;
              }

              /* Font loading optimization */
              .font-inter{
                font-family:'Inter',system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;
              }
            `,
          }}
        />

        {/* Optimize resource loading */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              // Resource hints for performance
              (function() {
                var links = [
                  'https://api.timebutler.de',
                  'https://fonts.gstatic.com'
                ];

                links.forEach(function(url) {
                  var link = document.createElement('link');
                  link.rel = 'dns-prefetch';
                  link.href = url;
                  document.head.appendChild(link);
                });

                // Font display optimization
                if ('FontFace' in window) {
                  var font = new FontFace('Inter', 'url(/fonts/Inter-Variable.woff2)', {
                    display: 'swap',
                    unicodeRange: 'U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+2000-206F,U+2074,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD'
                  });
                  font.load().then(function() {
                    document.fonts.add(font);
                    document.documentElement.classList.add('font-loaded');
                  });
                }

                // Performance monitoring
                if ('PerformanceObserver' in window) {
                  var observer = new PerformanceObserver(function(list) {
                    var entries = list.getEntries();
                    entries.forEach(function(entry) {
                      if (entry.name === 'first-contentful-paint') {
                        // Hide loading screen after FCP
                        var loadingScreen = document.querySelector('.loading-screen');
                        if (loadingScreen) {
                          loadingScreen.style.display = 'none';
                        }
                      }
                    });
                  });
                  observer.observe({ entryTypes: ['paint'] });
                }
              })();
            `,
          }}
        />
      </Head>

      <body className="h-full bg-white text-gray-900 font-inter antialiased">
        {/* Loading screen for better perceived performance */}
        <div className="loading-screen">
          <div className="flex flex-col items-center">
            <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4"></div>
            <div className="text-sm text-gray-600">TimeButler wird geladen...</div>
          </div>
        </div>

        {/* Main application content */}
        <Main />

        {/* Next.js scripts */}
        <NextScript />

        {/* Performance optimization scripts */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              // Remove loading screen on page load
              window.addEventListener('load', function() {
                var loadingScreen = document.querySelector('.loading-screen');
                if (loadingScreen) {
                  loadingScreen.style.opacity = '0';
                  loadingScreen.style.transition = 'opacity 0.3s ease-out';
                  setTimeout(function() {
                    loadingScreen.style.display = 'none';
                  }, 300);
                }
              });

              // Accessibility: Focus management
              window.addEventListener('load', function() {
                // Skip to main content functionality
                var skipLinks = document.querySelectorAll('a[href^="#"]');
                skipLinks.forEach(function(link) {
                  link.addEventListener('click', function(e) {
                    var target = document.querySelector(link.getAttribute('href'));
                    if (target) {
                      e.preventDefault();
                      target.focus();
                      target.scrollIntoView({ behavior: 'smooth' });
                    }
                  });
                });

                // Set focus to main content on page load
                var mainContent = document.getElementById('main-content');
                if (mainContent) {
                  mainContent.setAttribute('tabindex', '-1');
                }
              });

              // Progressive enhancement: Form enhancements
              document.addEventListener('DOMContentLoaded', function() {
                // Enhance forms for better UX
                var forms = document.querySelectorAll('form');
                forms.forEach(function(form) {
                  // Add loading states to form submissions
                  form.addEventListener('submit', function() {
                    var submitButton = form.querySelector('button[type="submit"]');
                    if (submitButton) {
                      submitButton.disabled = true;
                      submitButton.classList.add('loading');
                    }
                  });
                });

                // Add viewport height fix for mobile
                function setVH() {
                  var vh = window.innerHeight * 0.01;
                  document.documentElement.style.setProperty('--vh', vh + 'px');
                }
                setVH();
                window.addEventListener('resize', setVH);
              });

              // Error boundary fallback
              window.addEventListener('error', function(e) {
                console.error('Global error:', e.error);
                // Could send to error reporting service
              });

              // Service worker registration for PWA (if available)
              if ('serviceWorker' in navigator && 'production' === '${process.env.NODE_ENV}') {
                window.addEventListener('load', function() {
                  navigator.serviceWorker.register('/sw.js').catch(function(err) {
                    console.log('ServiceWorker registration failed:', err);
                  });
                });
              }
            `,
          }}
        />
      </body>
    </Html>
  );
}