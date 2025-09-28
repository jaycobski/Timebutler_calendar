/**
 * Accessibility Labels Hook
 * Provides bilingual ARIA labels and descriptions with dynamic formatting
 */

import { useCallback, useMemo } from 'react';
import type {
  A11yLabels,
  AriaAttributes,
  UseA11yLabelsReturn,
  BilingualA11yContent,
  SupportedLanguage
} from '../types/accessibility';
import { useLanguage } from './useLanguage';

export function useA11yLabels(): UseA11yLabelsReturn {
  const { language, t } = useLanguage();

  // Get localized label from bilingual content
  const getLabel = useCallback((
    labels: A11yLabels,
    type: keyof A11yLabels,
    fallback?: string
  ): string => {
    const content = labels[type];
    if (!content) {
      return fallback || '';
    }

    if (typeof content === 'string') {
      return content;
    }

    return content[language] || content.en || content.de || fallback || '';
  }, [language]);

  // Format message with variables
  const formatMessage = useCallback((
    template: BilingualA11yContent,
    variables?: Record<string, any>
  ): string => {
    let message = typeof template === 'string'
      ? template
      : template[language] || template.en || template.de || '';

    if (variables) {
      Object.entries(variables).forEach(([key, value]) => {
        message = message.replace(new RegExp(`\\{${key}\\}`, 'g'), String(value));
      });
    }

    return message;
  }, [language]);

  // Generate comprehensive ARIA attributes
  const getAriaAttributes = useCallback((
    labels: A11yLabels,
    config: AriaAttributes = {}
  ): AriaAttributes => {
    const attributes: AriaAttributes = { ...config };

    // Add label if available
    if (labels.label && !attributes['aria-label'] && !attributes['aria-labelledby']) {
      attributes['aria-label'] = getLabel(labels, 'label');
    }

    // Add description if available
    if (labels.description && !attributes['aria-describedby']) {
      const descriptionId = `desc-${Math.random().toString(36).substr(2, 9)}`;
      attributes['aria-describedby'] = descriptionId;
    }

    // Add error state
    if (labels.error) {
      attributes['aria-invalid'] = true;
      const errorId = `error-${Math.random().toString(36).substr(2, 9)}`;
      const existingDescribedBy = attributes['aria-describedby'];
      attributes['aria-describedby'] = existingDescribedBy
        ? `${existingDescribedBy} ${errorId}`
        : errorId;
    }

    // Add required state
    if (config['aria-required']) {
      attributes['aria-required'] = true;
    }

    return attributes;
  }, [getLabel]);

  // Create accessibility description element
  const createDescriptionElement = useCallback((
    id: string,
    content: BilingualA11yContent,
    className = 'sr-only'
  ): HTMLElement => {
    const element = document.createElement('div');
    element.id = id;
    element.className = className;
    element.textContent = formatMessage(content);
    element.setAttribute('aria-hidden', 'true');
    return element;
  }, [formatMessage]);

  // Get accessibility text from translation keys
  const getA11yText = useCallback((key: string, variables?: Record<string, any>): string => {
    const translationKey = `accessibility.${key}`;
    return t(translationKey, variables);
  }, [t]);

  // Get common ARIA labels
  const commonLabels = useMemo(() => ({
    close: {
      de: t('accessibility.labels.closeDialog'),
      en: t('accessibility.labels.closeDialog')
    },
    loading: {
      de: t('accessibility.labels.loading'),
      en: t('accessibility.labels.loading')
    },
    required: {
      de: t('accessibility.labels.required'),
      en: t('accessibility.labels.required')
    },
    optional: {
      de: t('accessibility.labels.optional'),
      en: t('accessibility.labels.optional')
    },
    expand: {
      de: t('accessibility.labels.expand'),
      en: t('accessibility.labels.expand')
    },
    collapse: {
      de: t('accessibility.labels.collapse'),
      en: t('accessibility.labels.collapse')
    }
  }), [t]);

  // Get error messages
  const errorMessages = useMemo(() => ({
    required: {
      de: t('accessibility.errors.requiredField'),
      en: t('accessibility.errors.requiredField')
    },
    invalidEmail: {
      de: t('accessibility.errors.invalidEmail'),
      en: t('accessibility.errors.invalidEmail')
    },
    invalidDate: {
      de: t('accessibility.errors.invalidDate'),
      en: t('accessibility.errors.invalidDate')
    },
    networkError: {
      de: t('accessibility.errors.networkError'),
      en: t('accessibility.errors.networkError')
    }
  }), [t]);

  // Get success messages
  const successMessages = useMemo(() => ({
    saved: {
      de: t('accessibility.success.dataSaved'),
      en: t('accessibility.success.dataSaved')
    },
    sent: {
      de: t('accessibility.success.emailSent'),
      en: t('accessibility.success.emailSent')
    },
    exported: {
      de: t('accessibility.success.calendarExported'),
      en: t('accessibility.success.calendarExported')
    }
  }), [t]);

  // Get navigation instructions
  const navigationInstructions = useMemo(() => ({
    keyboard: {
      de: t('accessibility.instructions.keyboardNavigation'),
      en: t('accessibility.instructions.keyboardNavigation')
    },
    form: {
      de: t('accessibility.instructions.formNavigation'),
      en: t('accessibility.instructions.formNavigation')
    },
    calendar: {
      de: t('accessibility.instructions.calendarNavigation'),
      en: t('accessibility.instructions.calendarNavigation')
    },
    list: {
      de: t('accessibility.instructions.listNavigation'),
      en: t('accessibility.instructions.listNavigation')
    },
    dialog: {
      de: t('accessibility.instructions.dialogNavigation'),
      en: t('accessibility.instructions.dialogNavigation')
    },
    table: {
      de: t('accessibility.instructions.tableNavigation'),
      en: t('accessibility.instructions.tableNavigation')
    }
  }), [t]);

  return {
    getLabel,
    getAriaAttributes,
    formatMessage,
    createDescriptionElement,
    getA11yText,
    commonLabels,
    errorMessages,
    successMessages,
    navigationInstructions,
  };
}

// Helper function to create bilingual content
export function createBilingualContent(de: string, en: string): BilingualA11yContent {
  return { de, en };
}

// Helper function to merge ARIA attributes
export function mergeAriaAttributes(...attributes: AriaAttributes[]): AriaAttributes {
  return attributes.reduce((merged, current) => {
    const result = { ...merged, ...current };

    // Handle special cases for describedby
    if (merged['aria-describedby'] && current['aria-describedby']) {
      result['aria-describedby'] = `${merged['aria-describedby']} ${current['aria-describedby']}`;
    }

    return result;
  }, {});
}

// Helper function to create skip link labels
export function createSkipLinkLabels(language: SupportedLanguage) {
  return {
    skipToContent: language === 'de'
      ? 'Zum Hauptinhalt springen'
      : 'Skip to main content',
    skipToNavigation: language === 'de'
      ? 'Zur Navigation springen'
      : 'Skip to navigation',
    skipToFooter: language === 'de'
      ? 'Zum Footer springen'
      : 'Skip to footer',
  };
}

// Helper function to create landmark labels
export function createLandmarkLabels(language: SupportedLanguage) {
  return {
    mainNavigation: language === 'de'
      ? 'Hauptnavigation'
      : 'Main navigation',
    breadcrumbNavigation: language === 'de'
      ? 'Brotkrümel-Navigation'
      : 'Breadcrumb navigation',
    pagination: language === 'de'
      ? 'Seitennavigation'
      : 'Page navigation',
    searchForm: language === 'de'
      ? 'Suchformular'
      : 'Search form',
  };
}

// Helper function to create form labels
export function createFormLabels(language: SupportedLanguage) {
  return {
    required: language === 'de' ? 'Pflichtfeld' : 'Required field',
    optional: language === 'de' ? 'Optional' : 'Optional',
    loading: language === 'de' ? 'Lädt...' : 'Loading...',
    error: language === 'de' ? 'Fehler' : 'Error',
    success: language === 'de' ? 'Erfolgreich' : 'Success',
    warning: language === 'de' ? 'Warnung' : 'Warning',
  };
}

// Helper function to create calendar labels
export function createCalendarLabels(language: SupportedLanguage) {
  return {
    selectDate: language === 'de' ? 'Datum auswählen' : 'Select date',
    previousMonth: language === 'de' ? 'Vorheriger Monat' : 'Previous month',
    nextMonth: language === 'de' ? 'Nächster Monat' : 'Next month',
    currentDate: language === 'de' ? 'Heutiges Datum' : 'Current date',
    calendarNavigation: language === 'de' ? 'Kalender-Navigation' : 'Calendar navigation',
  };
}

// Hook for component-specific accessibility
export function useComponentA11y(componentType: string) {
  const { getA11yText, getLabel, getAriaAttributes } = useA11yLabels();
  const { language } = useLanguage();

  const getComponentLabel = useCallback((key: string, variables?: Record<string, any>) => {
    return getA11yText(`${componentType}.${key}`, variables);
  }, [getA11yText, componentType]);

  const getComponentDescription = useCallback((key: string, variables?: Record<string, any>) => {
    return getA11yText(`descriptions.${componentType}${key ? `.${key}` : ''}`, variables);
  }, [getA11yText, componentType]);

  const getComponentInstructions = useCallback((key: string, variables?: Record<string, any>) => {
    return getA11yText(`instructions.${componentType}${key ? `.${key}` : ''}`, variables);
  }, [getA11yText, componentType]);

  return {
    getComponentLabel,
    getComponentDescription,
    getComponentInstructions,
    getLabel,
    getAriaAttributes,
    language
  };
}