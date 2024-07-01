import dayjs from 'dayjs';
import { t } from 'i18next';

export const formatTimeDiff = (diffValue: number) => {
  const duration = dayjs.duration(diffValue);

  if (duration.asMonths() >= 1) {
    return `${Math.floor(duration.asMonths())} months`;
  } else if (duration.asWeeks() >= 1) {
    return `${Math.floor(duration.asWeeks())} weeks`;
  } else if (duration.asDays() >= 1) {
    return `${Math.floor(duration.asDays())} days`;
  } else if (duration.asHours() >= 1) {
    return `${Math.floor(duration.asHours())} hours`;
  } else if (duration.asMinutes() >= 1) {
    return `${Math.floor(duration.asMinutes())} minutes`;
  } else {
    return 'a few seconds';
  }
};

export const formatTimeDiffPrevious = (timestamp: number) => {
  if (String(timestamp).length === 10) {
    timestamp *= 1000;
  }
  const diff = Date.now() - timestamp;
  if (diff < 0) return '';
  const text = formatTimeDiff(diff);
  return text === 'just now' ? text : text + ' ago';
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
