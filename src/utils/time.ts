import moment from 'moment/moment';

export const formatTimeDiff = (diffValue: number) => {
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

export const formatTimeGap = (timestamp: moment.MomentInput, prevTimestamp: moment.MomentInput) => {
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
