import dayjs from 'dayjs';

export const formatTimeDiff = (diffValue: number) => {
  const duration = dayjs.duration(diffValue);

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

export const formatTimeDiffPrevious = (timestamp: number) => {
  // 对秒级时间戳特殊处理
  if (String(timestamp).length === 10) {
    timestamp *= 1000;
  }
  const diff = Date.now() - timestamp;
  if (diff < 0) return '';
  const text = formatTimeDiff(diff);
  return text === '刚刚' ? text : text + '前';
};

export const timestampToCST = (timestamp: number | undefined) => {
  if (!timestamp) return '';
  const date = new Date(timestamp);
  return date.toLocaleString('zh-CN', { hour12: false });
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
