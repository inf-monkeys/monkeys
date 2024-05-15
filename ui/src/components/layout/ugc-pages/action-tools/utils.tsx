import React from 'react';

import { useTranslation } from 'react-i18next';

import { BlockPricing } from '@/apis/tools/typings.ts';

export const PricingText: React.FC<{ pricing: BlockPricing }> = ({ pricing }) => {
  const { t } = useTranslation();

  if (pricing.mode != 'free') pricing.unitPriceAmount = pricing.unitPriceAmount / 100;

  switch (pricing.mode) {
    case 'free':
      return t('ugc-page.action-tools.utils.pricing-mode.free');

    case 'per-execute':
    case 'per-1k-token':
    case 'per-1min':
    case 'per-1mb-file':
      return t(`ugc-page.action-tools.utils.pricing-mode.${pricing.mode}`, {
        amount: pricing.unitPriceAmount,
      });

    default:
      return t('common.utils.unknown');
  }
};
