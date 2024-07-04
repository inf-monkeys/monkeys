import React from 'react';

import { useTranslation } from 'react-i18next';

import { ToolPricing } from '@/apis/tools/typings.ts';

export const PricingText: React.FC<{ pricing: ToolPricing }> = ({ pricing }) => {
  const { t } = useTranslation();

  switch (pricing.pricingRule) {
    case 'FREE':
      return t('ugc-page.action-tools.utils.pricing-mode.FREE');

    case 'PER_EXECUTR':
    case 'PER_1K_TOKEN':
    case 'PER_1MIN':
      return t(`ugc-page.action-tools.utils.pricing-mode.${pricing.pricingRule}`, {
        amount: pricing.unitPrice / 100,
      });

    default:
      return t('common.utils.unknown');
  }
};
