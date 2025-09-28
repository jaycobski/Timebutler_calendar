/**
 * Email Confirmation Page - confirmation.tsx
 *
 * Professional email delivery confirmation with TimeButler branding
 * Provides clear status updates and next steps for calendar delivery
 *
 * Constitutional Requirements:
 * - Bilingual support (German formal, English casual)
 * - WCAG 2.1 Level AA accessibility compliance
 * - TimeButler brand integration
 * - Professional presentation with clear next steps
 * - Calendar download links and guidance
 * - Progressive enhancement (works without JavaScript)
 * - Performance optimized (<100ms interaction response)
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { GetServerSideProps } from 'next';

// Type imports
import type { SupportedLanguage } from '../types/language';

// Hook imports
import { useLanguage } from '../hooks';

// Styles
import '../styles/pages/confirmation.css';

// Icons for visual enhancement
const CheckCircleIcon = () => (
  <svg
    className="w-16 h-16 text-green-500"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
    aria-hidden="true"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
    />
  </svg>
);

const DownloadIcon = () => (
  <svg
    className="w-5 h-5"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
    aria-hidden="true"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
    />
  </svg>
);

const CalendarIcon = () => (
  <svg
    className="w-5 h-5"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
    aria-hidden="true"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
    />
  </svg>
);

const EmailIcon = () => (
  <svg
    className="w-5 h-5"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
    aria-hidden="true"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
    />
  </svg>
);

// Confirmation page props interface
interface ConfirmationPageProps {
  planId?: string;
  email?: string;
  language?: SupportedLanguage;
  deliveryStatus?: 'sent' | 'pending' | 'failed';
  downloadLink?: string;
  expiryDate?: string;
}

// Confirmation page component
const ConfirmationPage: React.FC<ConfirmationPageProps> = ({
  planId,
  email,
  language: initialLanguage = 'de',
  deliveryStatus = 'sent',
  downloadLink,
  expiryDate
}) => {
  const router = useRouter();
  const { language, t, switchLanguage } = useLanguage();

  // State management
  const [currentLanguage, setCurrentLanguage] = useState<SupportedLanguage>(
    initialLanguage || language || 'de'
  );
  const [isDownloading, setIsDownloading] = useState(false);
  const [showSecondaryActions, setShowSecondaryActions] = useState(false);

  // Sync language with URL parameter
  useEffect(() => {
    const urlLang = router.query.lang as SupportedLanguage;
    if (urlLang && (urlLang === 'de' || urlLang === 'en')) {
      setCurrentLanguage(urlLang);
      switchLanguage(urlLang);
    }
  }, [router.query.lang, switchLanguage]);

  // Get translated content using the translation system
  const content = useMemo(() => {
    return {
      pageTitle: t('confirmation.pageTitle'),
      pageDescription: t('confirmation.pageDescription'),
      title: t('confirmation.title'),
      subtitle: t('confirmation.subtitle'),
      statusMessages: {
        sent: t('confirmation.statusMessages.sent'),
        pending: t('confirmation.statusMessages.pending'),
        failed: t('confirmation.statusMessages.failed')
      },
      emailSentTo: t('confirmation.emailSentTo'),
      planReference: t('confirmation.planReference'),
      checkInboxTitle: t('confirmation.checkInboxTitle'),
      checkInboxItems: t('confirmation.checkInboxItems'),
      downloadTitle: t('confirmation.downloadTitle'),
      downloadDescription: t('confirmation.downloadDescription'),
      downloadButton: t('confirmation.downloadButton'),
      downloadExpiry: t('confirmation.downloadExpiry'),
      downloading: t('confirmation.downloading'),
      brandingTitle: t('confirmation.brandingTitle'),
      brandingText: t('confirmation.brandingText'),
      brandingCta: t('confirmation.brandingCta'),
      secondaryActionsTitle: t('confirmation.secondaryActionsTitle'),
      createNewPlan: t('confirmation.createNewPlan'),
      contactSupport: t('confirmation.contactSupport'),
      backToPlanner: t('confirmation.backToPlanner'),
      a11yLabels: {
        successIcon: t('confirmation.accessibility.successIcon'),
        downloadIcon: t('confirmation.accessibility.downloadIcon'),
        calendarIcon: t('confirmation.accessibility.calendarIcon'),
        emailIcon: t('confirmation.accessibility.emailIcon'),
        languageToggle: t('confirmation.accessibility.languageToggle'),
        skipToContent: t('confirmation.accessibility.skipToContent'),
        brandLogo: t('confirmation.accessibility.brandLogo')
      },
      downloadFailed: t('confirmation.errors.downloadFailed')
    };
  }, [t]);

  // Handle calendar download
  const handleDownload = useCallback(async () => {
    if (!downloadLink) return;

    setIsDownloading(true);

    try {
      // Track download event
      if (typeof window !== 'undefined' && window.gtag) {
        window.gtag('event', 'calendar_download', {
          plan_id: planId,
          email: email,
          method: 'direct_link'
        });
      }

      // Trigger download
      const link = document.createElement('a');
      link.href = downloadLink;
      link.download = `timebutler-vacation-calendar-${planId}.ics`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

    } catch (error) {
      console.error('Download failed:', error);

      // Show user-friendly error message
      alert(content.downloadFailed);
    } finally {
      setIsDownloading(false);
    }
  }, [downloadLink, planId, email, currentLanguage]);

  // Handle language toggle
  const handleLanguageToggle = useCallback(() => {
    const newLanguage = currentLanguage === 'de' ? 'en' : 'de';
    setCurrentLanguage(newLanguage);
    switchLanguage(newLanguage);

    // Update URL parameter
    router.push({
      pathname: router.pathname,
      query: { ...router.query, lang: newLanguage }
    }, undefined, { shallow: true });
  }, [currentLanguage, switchLanguage, router]);

  // Format expiry date
  const formattedExpiryDate = useMemo(() => {
    if (!expiryDate) return null;

    const date = new Date(expiryDate);
    const formatter = new Intl.DateTimeFormat(
      currentLanguage === 'de' ? 'de-DE' : 'en-US',
      {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }
    );

    return formatter.format(date);
  }, [expiryDate, currentLanguage]);

  return (
    <>
      <Head>
        <title>{content.pageTitle} | TimeButler</title>
        <meta name="description" content={content.pageDescription} />
        <meta name="robots" content="noindex, nofollow" />
        <meta property="og:title" content={content.pageTitle} />
        <meta property="og:description" content={content.pageDescription} />
        <meta property="og:type" content="website" />
        <link rel="canonical" href={`https://calendar.timebutler.de/confirmation`} />

        {/* Language alternates */}
        <link rel="alternate" hrefLang="de" href={`https://calendar.timebutler.de/confirmation?lang=de`} />
        <link rel="alternate" hrefLang="en" href={`https://calendar.timebutler.de/confirmation?lang=en`} />
        <link rel="alternate" hrefLang="x-default" href={`https://calendar.timebutler.de/confirmation`} />
      </Head>

      {/* Skip navigation for accessibility */}
      <a href="#main-content" className="skip-nav">
        {content.a11yLabels.skipToContent}
      </a>

      {/* Header with language toggle */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            {/* TimeButler logo */}
            <Link href="/" className="flex items-center space-x-2">
              <img
                src="/images/timebutler-logo.svg"
                alt={content.a11yLabels.brandLogo}
                className="h-8 w-auto"
                width="120"
                height="32"
              />
            </Link>

            {/* Language toggle */}
            <button
              onClick={handleLanguageToggle}
              className="language-toggle px-3 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded-md"
              aria-label={content.a11yLabels.languageToggle}
            >
              {currentLanguage === 'de' ? 'EN' : 'DE'}
            </button>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main id="main-content" className="confirmation-page flex-1 bg-gray-50 py-12">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">

          {/* Success confirmation section */}
          <div className="confirmation-card bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">

            {/* Success icon */}
            <div className="flex justify-center mb-6">
              <div className="success-icon">
                <CheckCircleIcon />
              </div>
              <span className="sr-only">{content.a11yLabels.successIcon}</span>
            </div>

            {/* Main heading */}
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              {content.title}
            </h1>

            {/* Subtitle */}
            <p className="text-lg text-gray-600 mb-8">
              {content.subtitle}
            </p>

            {/* Delivery status */}
            <div className={`status-indicator inline-flex items-center px-4 py-2 rounded-full text-sm font-medium mb-8 ${
              deliveryStatus === 'sent'
                ? 'bg-green-100 text-green-800 sent'
                : deliveryStatus === 'pending'
                ? 'bg-yellow-100 text-yellow-800'
                : 'bg-red-100 text-red-800'
            }`} role="status" aria-live="polite">
              <EmailIcon />
              <span className="ml-2">{content.statusMessages[deliveryStatus]}</span>
            </div>

            {/* Email details */}
            {email && (
              <div className="bg-gray-50 rounded-lg p-4 mb-8">
                <div className="text-sm text-gray-600 mb-1">
                  {content.emailSentTo}
                </div>
                <div className="email-display font-medium text-gray-900">
                  {email}
                </div>
                {planId && (
                  <>
                    <div className="text-sm text-gray-600 mt-2 mb-1">
                      {content.planReference}
                    </div>
                    <div className="plan-id-display font-mono text-sm text-gray-700">
                      {planId}
                    </div>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Next steps section */}
          <div className="confirmation-card bg-white rounded-lg shadow-sm border border-gray-200 p-8 mt-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
              <CalendarIcon />
              <span className="ml-2">{content.checkInboxTitle}</span>
            </h2>

            <ol className="space-y-4" role="list">
              {content.checkInboxItems.map((item, index) => (
                <li key={index} className="flex items-start" role="listitem">
                  <span className="step-indicator flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-medium mr-3">
                    {index + 1}
                  </span>
                  <span className="text-gray-700">{item}</span>
                </li>
              ))}
            </ol>
          </div>

          {/* Direct download section */}
          {downloadLink && (
            <div className="confirmation-card bg-white rounded-lg shadow-sm border border-gray-200 p-8 mt-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                <DownloadIcon />
                <span className="ml-2">{content.downloadTitle}</span>
              </h2>

              <p className="text-gray-600 mb-6">
                {content.downloadDescription}
              </p>

              <button
                onClick={handleDownload}
                disabled={isDownloading}
                className={`download-button inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white ${
                  isDownloading
                    ? 'loading bg-gray-400 cursor-not-allowed'
                    : 'bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
                } transition-colors duration-200`}
                aria-describedby={formattedExpiryDate ? 'download-expiry' : undefined}
              >
                <DownloadIcon />
                <span className="ml-2">
                  {isDownloading ? content.downloading : content.downloadButton}
                </span>
              </button>

              {formattedExpiryDate && (
                <p id="download-expiry" className="text-sm text-gray-500 mt-4">
                  {content.downloadExpiry.replace('{date}', formattedExpiryDate)}
                </p>
              )}
            </div>
          )}

          {/* TimeButler branding section */}
          <div className="branding-section bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200 p-8 mt-8">
            <div className="flex items-start space-x-4">
              <img
                src="/images/timebutler-logo.svg"
                alt={content.a11yLabels.brandLogo}
                className="w-12 h-12 flex-shrink-0"
                width="48"
                height="48"
              />
              <div className="flex-1">
                <h2 className="text-xl font-semibold text-gray-900 mb-3">
                  {content.brandingTitle}
                </h2>
                <p className="text-gray-700 mb-4">
                  {content.brandingText}
                </p>
                <a
                  href="https://timebutler.de"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
                >
                  {content.brandingCta}
                  <svg className="ml-2 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </a>
              </div>
            </div>
          </div>

          {/* Secondary actions */}
          <div className="mt-8">
            <button
              onClick={() => setShowSecondaryActions(!showSecondaryActions)}
              className="secondary-actions-toggle w-full text-center text-sm text-gray-500 hover:text-gray-700 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded-md"
              aria-expanded={showSecondaryActions}
              aria-controls="secondary-actions"
            >
              {content.secondaryActionsTitle}
              <svg
                className={`inline-block ml-1 w-4 h-4 transition-transform duration-200 ${
                  showSecondaryActions ? 'transform rotate-180' : ''
                }`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {showSecondaryActions && (
              <div id="secondary-actions" className="mt-4 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <Link
                    href="/plan"
                    className="text-center py-3 px-4 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors duration-200"
                  >
                    {content.createNewPlan}
                  </Link>
                  <Link
                    href="/plan"
                    className="text-center py-3 px-4 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors duration-200"
                  >
                    {content.backToPlanner}
                  </Link>
                  <a
                    href="mailto:support@timebutler.de"
                    className="text-center py-3 px-4 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors duration-200"
                  >
                    {content.contactSupport}
                  </a>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-center items-center text-sm text-gray-500">
            <span>© 2025 TimeButler GmbH. </span>
            <Link href="/privacy" className="ml-1 hover:text-gray-700">
              {currentLanguage === 'de' ? 'Datenschutz' : 'Privacy'}
            </Link>
            <span className="mx-2">|</span>
            <Link href="/imprint" className="hover:text-gray-700">
              {currentLanguage === 'de' ? 'Impressum' : 'Legal Notice'}
            </Link>
          </div>
        </div>
      </footer>

      {/* Performance monitoring */}
      {process.env.NODE_ENV === 'production' && (
        <script
          dangerouslySetInnerHTML={{
            __html: `
              // Track page load performance
              window.addEventListener('load', function() {
                if (window.gtag) {
                  var loadTime = performance.timing.loadEventEnd - performance.timing.navigationStart;
                  window.gtag('event', 'page_load_time', {
                    page_path: '/confirmation',
                    load_time: loadTime,
                    plan_id: '${planId || ''}',
                    delivery_status: '${deliveryStatus}'
                  });
                }
              });
            `
          }}
        />
      )}
    </>
  );
};

// Server-side props for confirmation page
export const getServerSideProps: GetServerSideProps<ConfirmationPageProps> = async (context) => {
  const { query } = context;

  // Extract URL parameters
  const planId = query.planId as string;
  const email = query.email as string;
  const language = (query.lang as SupportedLanguage) || 'de';
  const deliveryStatus = (query.status as 'sent' | 'pending' | 'failed') || 'sent';
  const downloadLink = query.downloadLink as string;
  const expiryDate = query.expiryDate as string;

  // Validate required parameters
  if (!planId) {
    return {
      notFound: true,
    };
  }

  // Set security headers
  context.res.setHeader('X-Frame-Options', 'DENY');
  context.res.setHeader('X-Content-Type-Options', 'nosniff');
  context.res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');

  return {
    props: {
      planId,
      email: email || null,
      language,
      deliveryStatus,
      downloadLink: downloadLink || null,
      expiryDate: expiryDate || null,
    },
  };
};

export default ConfirmationPage;