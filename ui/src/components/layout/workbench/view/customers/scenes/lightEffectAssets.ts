// 光影大片背景与光照风格资源（来源 1.0，域名已替换为当前 OSS 前缀）

export const BACKGROUND_CATEGORIES = [
  { id: 'outdoor', label: '户外' },
  { id: 'cold', label: '极寒' },
  { id: 'puff', label: '泡芙' },
] as const;

export const BACKGROUND_OPTIONS: Record<string, Array<{ id: string; label: string; image: string }>> = {
  outdoor: [
    { id: 'forest', label: '森林', image: 'https://inf-monkeys.oss-cn-beijing.aliyuncs.com/TemporaryImages/bsd/%E5%85%89%E5%BD%B1%E5%A4%A7%E7%89%87%E6%8F%90%E7%A4%BA%E8%AF%8D%E5%AD%97%E5%85%B8%E7%BC%A9%E7%95%A5%E5%9B%BE/Forest.png' },
    { id: 'camp', label: '露营', image: 'https://inf-monkeys.oss-cn-beijing.aliyuncs.com/TemporaryImages/bsd/%E5%85%89%E5%BD%B1%E5%A4%A7%E7%89%87%E6%8F%90%E7%A4%BA%E8%AF%8D%E5%AD%97%E5%85%B8%E7%BC%A9%E7%95%A5%E5%9B%BE/Camp.png' },
    { id: 'gorge', label: '峡谷', image: 'https://inf-monkeys.oss-cn-beijing.aliyuncs.com/TemporaryImages/bsd/%E5%85%89%E5%BD%B1%E5%A4%A7%E7%89%87%E6%8F%90%E7%A4%BA%E8%AF%8D%E5%AD%97%E5%85%B8%E7%BC%A9%E7%95%A5%E5%9B%BE/Gorge.png' },
    { id: 'snow', label: '雪山', image: 'https://inf-monkeys.oss-cn-beijing.aliyuncs.com/TemporaryImages/bsd/%E5%85%89%E5%BD%B1%E5%A4%A7%E7%89%87%E6%8F%90%E7%A4%BA%E8%AF%8D%E5%AD%97%E5%85%B8%E7%BC%A9%E7%95%A5%E5%9B%BE/Snow-capped%20mountain.png' },
    { id: 'runway', label: 'T台', image: 'https://inf-monkeys.oss-cn-beijing.aliyuncs.com/TemporaryImages/bsd/%E5%85%89%E5%BD%B1%E5%A4%A7%E7%89%87%E6%8F%90%E7%A4%BA%E8%AF%8D%E5%AD%97%E5%85%B8%E7%BC%A9%E7%95%A5%E5%9B%BE/T-T.png' },
  ],
  cold: [
    { id: 'polar', label: '极地', image: 'https://inf-monkeys.oss-cn-beijing.aliyuncs.com/TemporaryImages/bsd/%E5%85%89%E5%BD%B1%E5%A4%A7%E7%89%87%E6%8F%90%E7%A4%BA%E8%AF%8D%E5%AD%97%E5%85%B8%E7%BC%A9%E7%95%A5%E5%9B%BE/Polar%20region.png' },
    { id: 'snow_cold', label: '雪山', image: 'https://inf-monkeys.oss-cn-beijing.aliyuncs.com/TemporaryImages/bsd/%E5%85%89%E5%BD%B1%E5%A4%A7%E7%89%87%E6%8F%90%E7%A4%BA%E8%AF%8D%E5%AD%97%E5%85%B8%E7%BC%A9%E7%95%A5%E5%9B%BE/Snow-capped%20mountain.png' },
    { id: 'star', label: '星空', image: 'https://inf-monkeys.oss-cn-beijing.aliyuncs.com/TemporaryImages/bsd/%E5%85%89%E5%BD%B1%E5%A4%A7%E7%89%87%E6%8F%90%E7%A4%BA%E8%AF%8D%E5%AD%97%E5%85%B8%E7%BC%A9%E7%95%A5%E5%9B%BE/Starry%20sky.png' },
    { id: 'runway_cold', label: 'T台', image: 'https://inf-monkeys.oss-cn-beijing.aliyuncs.com/TemporaryImages/bsd/%E5%85%89%E5%BD%B1%E5%A4%A7%E7%89%87%E6%8F%90%E7%A4%BA%E8%AF%8D%E5%AD%97%E5%85%B8%E7%BC%A9%E7%95%A5%E5%9B%BE/T-T.png' },
  ],
  puff: [
    { id: 'moon', label: '月球', image: 'https://inf-monkeys.oss-cn-beijing.aliyuncs.com/TemporaryImages/bsd/%E5%85%89%E5%BD%B1%E5%A4%A7%E7%89%87%E6%8F%90%E7%A4%BA%E8%AF%8D%E5%AD%97%E5%85%B8%E7%BC%A9%E7%95%A5%E5%9B%BE/The%20surface%20of%20the%20moon.png' },
    { id: 'tech', label: '科技感背景', image: 'https://inf-monkeys.oss-cn-beijing.aliyuncs.com/TemporaryImages/bsd/%E5%85%89%E5%BD%B1%E5%A4%A7%E7%89%87%E6%8F%90%E7%A4%BA%E8%AF%8D%E5%AD%97%E5%85%B8%E7%BC%A9%E7%95%A5%E5%9B%BE/Inside%20the%20spaceship.png' },
    { id: 'indoor', label: '室内', image: 'https://inf-monkeys.oss-cn-beijing.aliyuncs.com/TemporaryImages/bsd/%E5%85%89%E5%BD%B1%E5%A4%A7%E7%89%87%E6%8F%90%E7%A4%BA%E8%AF%8D%E5%AD%97%E5%85%B8%E7%BC%A9%E7%95%A5%E5%9B%BE/Coffee.png' },
    { id: 'studio', label: '摄影棚', image: 'https://inf-monkeys.oss-cn-beijing.aliyuncs.com/TemporaryImages/bsd/%E5%85%89%E5%BD%B1%E5%A4%A7%E7%89%87%E6%8F%90%E7%A4%BA%E8%AF%8D%E5%AD%97%E5%85%B8%E7%BC%A9%E7%95%A5%E5%9B%BE/Film%20studio.png' },
    { id: 'abstract', label: '抽象极简主义', image: 'https://inf-monkeys.oss-cn-beijing.aliyuncs.com/TemporaryImages/bsd/%E5%85%89%E5%BD%B1%E5%A4%A7%E7%89%87%E6%8F%90%E7%A4%BA%E8%AF%8D%E5%AD%97%E5%85%B8%E7%BC%A9%E7%95%A5%E5%9B%BE/abstract_minimalism.jpg' },
    { id: 'office', label: '办公室', image: 'https://inf-monkeys.oss-cn-beijing.aliyuncs.com/TemporaryImages/bsd/%E5%85%89%E5%BD%B1%E5%A4%A7%E7%89%87%E6%8F%90%E7%A4%BA%E8%AF%8D%E5%AD%97%E5%85%B8%E7%BC%A9%E7%95%A5%E5%9B%BE/Office.png' },
    { id: 'runway_puff', label: 'T台', image: 'https://inf-monkeys.oss-cn-beijing.aliyuncs.com/TemporaryImages/bsd/%E5%85%89%E5%BD%B1%E5%A4%A7%E7%89%87%E6%8F%90%E7%A4%BA%E8%AF%8D%E5%AD%97%E5%85%B8%E7%BC%A9%E7%95%A5%E5%9B%BE/T-T.png' },
  ],
};

export const LIGHT_STYLE_OPTIONS: Array<{ id: string; label: string; image: string }> = [
  { id: 'natural', label: '自然光', image: 'https://inf-monkeys.oss-cn-beijing.aliyuncs.com/TemporaryImages/bsd/%E5%85%89%E5%BD%B1%E5%A4%A7%E7%89%87%E6%8F%90%E7%A4%BA%E8%AF%8D%E5%AD%97%E5%85%B8%E7%BC%A9%E7%95%A5%E5%9B%BE/natural%20light.png' },
  { id: 'rembrandt', label: '伦勃朗光', image: 'https://inf-monkeys.oss-cn-beijing.aliyuncs.com/TemporaryImages/bsd/%E5%85%89%E5%BD%B1%E5%A4%A7%E7%89%87%E6%8F%90%E7%A4%BA%E8%AF%8D%E5%AD%97%E5%85%B8%E7%BC%A9%E7%95%A5%E5%9B%BE/Rembrandt%20light.png' },
  { id: 'studio', label: '摄影棚灯光', image: 'https://inf-monkeys.oss-cn-beijing.aliyuncs.com/TemporaryImages/bsd/%E5%85%89%E5%BD%B1%E5%A4%A7%E7%89%87%E6%8F%90%E7%A4%BA%E8%AF%8D%E5%AD%97%E5%85%B8%E7%BC%A9%E7%95%A5%E5%9B%BE/Studio%20light.png' },
  { id: 'tindal', label: '丁达尔光', image: 'https://inf-monkeys.oss-cn-beijing.aliyuncs.com/TemporaryImages/bsd/%E5%85%89%E5%BD%B1%E5%A4%A7%E7%89%87%E6%8F%90%E7%A4%BA%E8%AF%8D%E5%AD%97%E5%85%B8%E7%BC%A9%E7%95%A5%E5%9B%BE/Tindal%20light.png' },
  { id: 'cyber', label: '赛博光', image: 'https://inf-monkeys.oss-cn-beijing.aliyuncs.com/TemporaryImages/bsd/%E5%85%89%E5%BD%B1%E5%A4%A7%E7%89%87%E6%8F%90%E7%A4%BA%E8%AF%8D%E5%AD%97%E5%85%B8%E7%BC%A9%E7%95%A5%E5%9B%BE/Cyberlight.png' },
  { id: 'light_shadow', label: '光与影', image: 'https://inf-monkeys.oss-cn-beijing.aliyuncs.com/TemporaryImages/bsd/%E5%85%89%E5%BD%B1%E5%A4%A7%E7%89%87%E6%8F%90%E7%A4%BA%E8%AF%8D%E5%AD%97%E5%85%B8%E7%BC%A9%E7%95%A5%E5%9B%BE/light%20and%20shadow.png' },
  { id: 'black_white', label: '黑白光影', image: 'https://inf-monkeys.oss-cn-beijing.aliyuncs.com/TemporaryImages/bsd/%E5%85%89%E5%BD%B1%E5%A4%A7%E7%89%87%E6%8F%90%E7%A4%BA%E8%AF%8D%E5%AD%97%E5%85%B8%E7%BC%A9%E7%95%A5%E5%9B%BE/Black%20and%20while%20light%20and%20shadow.png' },
];
