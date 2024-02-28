import {
  readLocalStorageValue as mantineReadLocalStorageValue,
  useLocalStorage as mantineUseLocalStorage,
} from '@mantine/hooks';
import clsx, { ClassValue } from 'clsx';
import { isString } from 'lodash';
import moment from 'moment';
import { parse, stringify } from 'superjson';
import { twMerge } from 'tailwind-merge';

export const cn = (...inputs: ClassValue[]) => twMerge(clsx(inputs));

export const useLocalStorage = <T>(key: string, defaultValue: T, useJSON = true) =>
  mantineUseLocalStorage({
    key,
    defaultValue,
    serialize: useJSON ? stringify : (val) => val as string,
    deserialize: (str) => (str === undefined ? defaultValue : useJSON ? parse(str) : str) as T,
  });

export const readLocalStorageValue = <T>(key: string, defaultValue: T, useJSON = true) =>
  mantineReadLocalStorageValue({
    key,
    defaultValue,
    deserialize: (str) => (str === undefined ? defaultValue : useJSON ? parse(str) : str) as T,
  });

export const dispatchLocalStorageEvent = <T>(key: string, value: T) =>
  window.dispatchEvent(
    new CustomEvent('mantine-local-storage', {
      detail: {
        key,
        value,
      },
    }),
  );

export const setLocalStorage = <T>(key: string, value: T) => {
  const finalData = isString(value) ? value : stringify(value);
  localStorage.setItem(key, finalData);
  dispatchLocalStorageEvent(key, value);
};

export const useTimeDiff = () => {
  const formatTimeDiff = (diffValue: number) => {
    const duration = moment.duration(diffValue);

    if (duration.asMonths() >= 1) {
      return `${Math.floor(duration.asMonths())} 月`;
    } else if (duration.asWeeks() >= 1) {
      return `${Math.floor(duration.asWeeks())} 周`;
    } else if (duration.asDays() >= 1) {
      return `${Math.floor(duration.asDays())} 天`;
    } else if (duration.asHours() >= 1) {
      return `${Math.floor(duration.asHours())} 小时`;
    } else if (duration.asMinutes() >= 1) {
      return `${Math.floor(duration.asMinutes())} 分钟`;
    } else {
      return '数秒';
    }
  };

  const formatTimeDiffPrevious = (timestamp: number) => {
    // 对秒级时间戳特殊处理
    if (String(timestamp).length === 10) {
      timestamp *= 1000;
    }
    const diff = Date.now() - timestamp;
    if (diff < 0) return '';
    const text = formatTimeDiff(diff);
    return text === '刚刚' ? text : text + '前';
  };

  const timestampToCST = (timestamp: number | undefined) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    return date.toLocaleString('zh-CN', { hour12: false });
  };

  const formatTimeGap = (timestamp: moment.MomentInput, prevTimestamp: moment.MomentInput) => {
    const diff = moment.duration(moment(timestamp).valueOf() - moment(prevTimestamp).valueOf());
    const diffAsSeconds = diff.asSeconds();
    if (diffAsSeconds < 0) {
      return '-';
    }
    if (diffAsSeconds < 60) {
      return diff.seconds() + 's';
    } else if (diff.asMinutes() < 60) {
      return diff.minutes() + 'm ' + diff.seconds() + 's';
    } else {
      return diff.hours() + ':' + diff.minutes() + ':' + diff.seconds();
    }
  };

  return { formatTimeDiff, formatTimeDiffPrevious, timestampToCST, formatTimeGap };
};
