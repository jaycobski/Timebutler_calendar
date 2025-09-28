/**
 * Skip Navigation Component
 * Provides skip links for keyboard users with bilingual support
 */

import React, { useCallback, useEffect, useRef } from 'react';
import type { SkipLinkConfig, SupportedLanguage } from '../types/accessibility';
import { useA11yLabels } from '../hooks/useA11yLabels';
import { useScreenReader } from '../hooks/useScreenReader';
import { useLanguage } from '../hooks/useLanguage';

interface SkipNavigationProps {
  links?: SkipLinkConfig[];
  className?: string;
  showOnFocus?: boolean;
  style?: React.CSSProperties;
}

const DEFAULT_SKIP_LINKS: SkipLinkConfig[] = [
  {
    href: '#main',
    label: {
      de: 'Zum Hauptinhalt springen',
      en: 'Skip to main content'
    },
    order: 1,
    visible: true
  },
  {
    href: '#navigation',
    label: {
      de: 'Zur Navigation springen',
      en: 'Skip to navigation'
    },
    order: 2,
    visible: false
  },
  {
    href: '#footer',
    label: {
      de: 'Zum Footer springen',
      en: 'Skip to footer'
    },
    order: 3,
    visible: false
  }
];

export function SkipNavigation({
  links = DEFAULT_SKIP_LINKS,
  className = '',
  showOnFocus = true,
  style
}: SkipNavigationProps) {
  const { getLabel } = useA11yLabels();
  const { announceNavigation } = useScreenReader();
  const { language } = useLanguage();
  const skipNavRef = useRef<HTMLDivElement>(null);

  // Sort links by order
  const sortedLinks = [...links].sort((a, b) => a.order - b.order);

  // Handle skip link click
  const handleSkipClick = useCallback((event: React.MouseEvent<HTMLAnchorElement>, link: SkipLinkConfig) => {
    event.preventDefault();

    const target = document.querySelector(link.href);
    if (target instanceof HTMLElement) {
      // Make target focusable if it isn't already
      const originalTabIndex = target.tabIndex;
      if (originalTabIndex < 0) {
        target.tabIndex = -1;
      }

      // Focus the target
      target.focus();

      // Scroll to target
      target.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
      });

      // Announce navigation change
      const message = {
        de: `Navigiert zu ${getLabel({ label: link.label }, 'label')}`,
        en: `Navigated to ${getLabel({ label: link.label }, 'label')}`
      };
      announceNavigation(message);

      // Restore original tabIndex after focus
      setTimeout(() => {
        if (originalTabIndex >= 0) {
          target.tabIndex = originalTabIndex;
        } else {
          target.removeAttribute('tabindex');
        }
      }, 100);
    }
  }, [getLabel, announceNavigation]);

  // Handle keyboard navigation
  const handleKeyDown = useCallback((event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Escape') {
      // Return focus to first focusable element
      const firstFocusable = document.querySelector('a, button, input, textarea, select, [tabindex]:not([tabindex="-1"])') as HTMLElement;
      firstFocusable?.focus();
    }
  }, []);

  // Auto-focus first skip link on page load for keyboard users
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Tab' && !event.shiftKey && document.activeElement === document.body) {
        const firstSkipLink = skipNavRef.current?.querySelector('a') as HTMLElement;
        if (firstSkipLink) {
          firstSkipLink.focus();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  const skipNavStyles: React.CSSProperties = {
    position: 'absolute',
    top: 0,
    left: 0,
    zIndex: 9999,
    padding: '8px',
    backgroundColor: '#ffffff',
    border: '2px solid #0066cc',
    borderRadius: '4px',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.2)',
    ...style
  };

  const linkStyles: React.CSSProperties = {
    display: 'inline-block',
    padding: '8px 16px',
    margin: '0 4px',
    color: '#0066cc',
    backgroundColor: 'transparent',
    border: '1px solid #0066cc',
    borderRadius: '4px',
    textDecoration: 'none',
    fontSize: '14px',
    fontWeight: 'bold',
    cursor: 'pointer',
    transition: 'all 0.2s ease'
  };

  const visibleLinkStyles: React.CSSProperties = {
    ...linkStyles,
    position: 'relative',
    transform: 'translateY(0)',
    opacity: 1
  };

  const hiddenLinkStyles: React.CSSProperties = {
    ...linkStyles,
    position: 'absolute',
    transform: 'translateY(-100%)',
    opacity: 0,
    ...(showOnFocus && {
      ':focus': {
        position: 'relative',
        transform: 'translateY(0)',
        opacity: 1
      }
    })
  };

  const focusStyles = `
    .skip-link:focus {
      position: relative !important;
      transform: translateY(0) !important;
      opacity: 1 !important;
      outline: 2px solid #0066cc !important;
      outline-offset: 2px !important;
    }

    .skip-link:hover {
      background-color: #f0f8ff !important;
      border-color: #004499 !important;
      color: #004499 !important;
    }

    .skip-link:active {
      background-color: #e6f3ff !important;
      transform: scale(0.98) !important;
    }
  `;

  return (
    <>
      <style>{focusStyles}</style>
      <div
        ref={skipNavRef}
        className={`skip-navigation ${className}`}
        style={skipNavStyles}
        onKeyDown={handleKeyDown}
        role="navigation"
        aria-label={language === 'de' ? 'Sprungnavigation' : 'Skip navigation'}
      >
        {sortedLinks.map((link, index) => (
          <a
            key={`${link.href}-${index}`}
            href={link.href}
            className={`skip-link ${link.className || ''}`}
            style={link.visible ? visibleLinkStyles : hiddenLinkStyles}
            onClick={(event) => handleSkipClick(event, link)}
            tabIndex={0}
          >
            {getLabel({ label: link.label }, 'label')}
          </a>
        ))}
      </div>
    </>
  );
}

// Hook for managing skip links
export function useSkipNavigation() {
  const { language } = useLanguage();

  const createSkipLink = useCallback((
    href: string,
    labelKey: string,
    order: number = 1,
    visible: boolean = false
  ): SkipLinkConfig => ({
    href,
    label: {
      de: labelKey, // In real app, would translate this
      en: labelKey
    },
    order,
    visible
  }), []);

  const getDefaultSkipLinks = useCallback((): SkipLinkConfig[] => [
    createSkipLink('#main',
      language === 'de' ? 'Zum Hauptinhalt springen' : 'Skip to main content',
      1, false),
    createSkipLink('#navigation',
      language === 'de' ? 'Zur Navigation springen' : 'Skip to navigation',
      2, false),
    createSkipLink('#search',
      language === 'de' ? 'Zur Suche springen' : 'Skip to search',
      3, false),
    createSkipLink('#footer',
      language === 'de' ? 'Zum Footer springen' : 'Skip to footer',
      4, false)
  ], [language, createSkipLink]);

  return {
    createSkipLink,
    getDefaultSkipLinks
  };
}

export default SkipNavigation;