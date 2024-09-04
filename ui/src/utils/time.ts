import dayjs from 'dayjs';
import _ from 'lodash';

import i18n from '@/i18n.ts';

export const formatTimeDiff = (diffValue: number) => {
  const duration = dayjs.duration(diffValue);

  const { t } = i18n;

  if (duration.asMonths() >= 1) {
    const count = Math.floor(duration.asMonths());
    return `${count} ${t('common.time.month', { count })}`;
  } else if (duration.asWeeks() >= 1) {
    const count = Math.floor(duration.asWeeks());
    return `${count} ${t('common.time.week', { count })}`;
  } else if (duration.asDays() >= 1) {
    const count = Math.floor(duration.asDays());
    return `${count} ${t('common.time.day', { count })}`;
  } else if (duration.asHours() >= 1) {
    const count = Math.floor(duration.asHours());
    return `${count} ${t('common.time.hour', { count })}`;
  } else if (duration.asMinutes() >= 1) {
    const count = Math.floor(duration.asMinutes());
    return `${count} ${t('common.time.minute', { count })}`;
  } else {
    return t('common.time.a-few-seconds');
  }
};

export const formatTimeDiffPrevious = (timestamp: number | string) => {
  !_.isNumber(timestamp) && (timestamp = _.toNumber(timestamp));
  if (String(timestamp).length === 10) {
    timestamp *= 1000;
  }
  const diff = Date.now() - timestamp;
  if (diff < 0) return '';
  const text = formatTimeDiff(diff);
  const { t } = i18n;
  return text === t('common.time.just-now')
    ? text
    : t('common.time.ago', {
        time: text,
      });
};

export const formatTimeGap = (timestamp: dayjs.ConfigType, prevTimestamp: dayjs.ConfigType) => {
  const diff = dayjs.duration(dayjs(timestamp).valueOf() - dayjs(prevTimestamp).valueOf());
  const diffAsSeconds = diff.asSeconds();
  if (diffAsSeconds < 0) {
    return '-';
  }
  if (diffAsSeconds < 60) {
    return diff.seconds() + 's';
  } else if (diff.asMinutes() < 60) {
    return diff.minutes() + 'm ' + diff.seconds() + 's';
  } else {
    // 注意：dayjs的duration对象没有直接提供hours()方法，需要通过asHours()获取小时数并向下取整
    const hours = Math.floor(diff.asHours());
    const minutes = diff.minutes();
    const seconds = diff.seconds();
    return hours + ':' + minutes + ':' + seconds;
  }
};

export const formatTime = ({ seconds, defaultSeconds }: { seconds?: number; defaultSeconds?: number }) => {
  seconds = seconds ?? defaultSeconds;

  if (!seconds || isNaN(seconds) || seconds < 0) {
    return 'Invalid input';
  }

  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = seconds % 60;

  let result = '';

  const { t } = i18n;

  if (hours > 0) {
    result += `${hours} ${t('common.time.hour', {
      count: hours,
    })} `;
  }

  if (minutes > 0) {
    result += `${minutes} ${t('common.time.minute', {
      count: minutes,
    })} `;
  }

  if (remainingSeconds > 0) {
    result += `${remainingSeconds} ${t('common.time.second', {
      count: seconds,
    })}`;
  }

  return result.trim();
};
