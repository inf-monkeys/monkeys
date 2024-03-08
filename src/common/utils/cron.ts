import cron from 'cron-parser';

export function getNextCronTimestamp(cronExpression: string) {
  try {
    const interval = cron.parseExpression(cronExpression);
    const nextDate = interval.next();
    return nextDate.getTime();
  } catch (error) {
    throw new Error('无法解析的 cron 表达式');
  }
}

export function calculateTimeDifference(cronExpression: string) {
  try {
    // 创建 CronParser 实例
    const parser = cron.parseExpression(cronExpression);
    // 获取时间间隔
    const interval = parser.next().getTime() - parser.prev().getTime();

    return {
      interval,
    };
  } catch (err) {
    throw new Error('无法解析的 cron 表达式');
  }
}
