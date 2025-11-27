import type { InspirationGenerationOptions } from './InspirationGenerationPanel';


export type BsdModelOption = {
  en: string;
  path: string;
  modelType: 'style' | 'brand';
  scenarios: string[];
  categories: string[];
  submit_name: string;
  show_name: string;
  visible?: boolean;
};

// 2.0 用的模型配置示例，可按需扩充/替换
export const MODEL_LIBRARY: Record<string, BsdModelOption> = {
  "时尚极寒25": {
    en: "fashion_extreme_cold",
    path: "https://inf-monkeys.oss-cn-beijing.aliyuncs.com/TemporaryImages/bsd/%E7%81%B5%E6%84%9F%E7%94%9F%E6%88%90lora%E7%BC%A9%E7%95%A5%E5%9B%BE/fashion_extreme_cold.png",
    modelType: "style",
    scenarios: ["极寒"],
    categories: ["内绗羽绒服"],
    submit_name: "时尚极寒25",
    show_name: "时尚极寒25",
    visible: true
  },
  "未来工业风": {
    en: "futuristic_industrial_style_(diamond_stitching)",
    path: "https://inf-monkeys.oss-cn-beijing.aliyuncs.com/TemporaryImages/bsd/%E7%81%B5%E6%84%9F%E7%94%9F%E6%88%90lora%E7%BC%A9%E7%95%A5%E5%9B%BE/futuristic_industrial_style_%28diamond_stitching%29.png",
    modelType: "style",
    scenarios: ["泡芙"],
    categories: ["外绗羽绒服"],
    submit_name: "未来工业风",
    show_name: "未来工业风",
    visible: true
  },
  "创新泡芙25": {
    en: "innovative_puffer_(irregular_quilting)",
    path: "https://inf-monkeys.oss-cn-beijing.aliyuncs.com/TemporaryImages/bsd/%E7%81%B5%E6%84%9F%E7%94%9F%E6%88%90lora%E7%BC%A9%E7%95%A5%E5%9B%BE/innovative_puffer_%28irregular_quilting%29.png",
    modelType: "style",
    scenarios: ["泡芙"],
    categories: ["外绗羽绒服"],
    submit_name: "创新泡芙25",
    show_name: "创新泡芙25",
    visible: true
  },
  "实用极简风": {
    en: "pragmatic_minimalism_(menswear)",
    path: "https://inf-monkeys.oss-cn-beijing.aliyuncs.com/TemporaryImages/bsd/%E7%81%B5%E6%84%9F%E7%94%9F%E6%88%90lora%E7%BC%A9%E7%95%A5%E5%9B%BE/pragmatic_minimalism_%28menswear%29.png",
    modelType: "style",
    scenarios: ["泡芙"],
    categories: ["外绗羽绒服"],
    submit_name: "实用极简风",
    show_name: "实用极简风",
    visible: true
  },
  "松弛感‌日常": {
    en: "relaxed_daily_style",
    path: "https://inf-monkeys.oss-cn-beijing.aliyuncs.com/TemporaryImages/bsd/%E7%81%B5%E6%84%9F%E7%94%9F%E6%88%90lora%E7%BC%A9%E7%95%A5%E5%9B%BE/relaxed_daily_style.png",
    modelType: "style",
    scenarios: ["泡芙"],
    categories: ["外绗羽绒服"],
    submit_name: "松弛感‌日常",
    show_name: "松弛感‌日常",
    visible: true
  },
  "城市轻户外": {
    en: "City light outdoor",
    path: "https://inf-monkeys.oss-cn-beijing.aliyuncs.com/TemporaryImages/bsd/%E7%81%B5%E6%84%9F%E7%94%9F%E6%88%90lora%E7%BC%A9%E7%95%A5%E5%9B%BE/csqhw.png",
    modelType: "style",
    scenarios: ["户外"],
    categories: ["功能外套", "冲锋衣"],
    submit_name: "城市轻户外",
    show_name: "城市轻户外",
    visible: true
  },
  "龟背廓形感": {
    en: "Turtle back silhouette",
    path: "https://inf-monkeys.oss-cn-beijing.aliyuncs.com/TemporaryImages/bsd/%E7%81%B5%E6%84%9F%E7%94%9F%E6%88%90lora%E7%BC%A9%E7%95%A5%E5%9B%BE/gbpf.png",
    modelType: "style",
    scenarios: ["泡芙"],
    categories: ["外绗羽绒服"],
    submit_name: "龟背廓形感",
    show_name: "龟背廓形感",
    visible: true
  },
  "探月之旅": {
    en: "Moon exploration",
    path: "https://inf-monkeys.oss-cn-beijing.aliyuncs.com/TemporaryImages/bsd/%E7%81%B5%E6%84%9F%E7%94%9F%E6%88%90lora%E7%BC%A9%E7%95%A5%E5%9B%BE/tyzl.png",
    modelType: "style",
    scenarios: ["运动"],
    categories: ["外绗羽绒服", "内绗羽绒服"],
    submit_name: "探月之旅",
    show_name: "探月之旅",
    visible: true
  },
  "BC穿搭": {
    en: "BC clothing",
    path: "https://inf-monkeys.oss-cn-beijing.aliyuncs.com/TemporaryImages/bsd/%E7%81%B5%E6%84%9F%E7%94%9F%E6%88%90lora%E7%BC%A9%E7%95%A5%E5%9B%BE/BC.png",
    modelType: "style",
    scenarios: ["商务"],
    categories: ["外绗羽绒服", "内绗羽绒服", "轻薄羽绒服"],
    submit_name: "BC穿搭",
    show_name: "BC穿搭",
    visible: true
  },
  "KJ商务风": {
    en: "KJ business style",
    path: "https://inf-monkeys.oss-cn-beijing.aliyuncs.com/TemporaryImages/bsd/%E7%81%B5%E6%84%9F%E7%94%9F%E6%88%90lora%E7%BC%A9%E7%95%A5%E5%9B%BE/KJ.png",
    modelType: "style",
    scenarios: ["商务"],
    categories: ["外绗羽绒服", "内绗羽绒服"],
    submit_name: "KJ商务风",
    show_name: "KJ商务风",
    visible: true
  },
  "静奢轻户外": {
    en: "Static luxury light outdoor",
    path: "https://inf-monkeys.oss-cn-beijing.aliyuncs.com/TemporaryImages/bsd/%E7%81%B5%E6%84%9F%E7%94%9F%E6%88%90lora%E7%BC%A9%E7%95%A5%E5%9B%BE/jsqhw.png",
    modelType: "style",
    scenarios: ["户外"],
    categories: ["功能外套"],
    submit_name: "静奢轻户外",
    show_name: "静奢轻户外",
    visible: true
  },
  "都市运动风": {
    en: "Urban sports style",
    path: "https://inf-monkeys.oss-cn-beijing.aliyuncs.com/TemporaryImages/bsd/%E7%81%B5%E6%84%9F%E7%94%9F%E6%88%90lora%E7%BC%A9%E7%95%A5%E5%9B%BE/dsydf.png",
    modelType: "style",
    scenarios: ["运动"],
    categories: ["外绗羽绒服", "轻薄羽绒服"],
    submit_name: "都市运动风",
    show_name: "都市运动风",
    visible: true
  },
  "优雅静奢风": {
    en: "Elegant static luxury style",
    path: "https://inf-monkeys.oss-cn-beijing.aliyuncs.com/TemporaryImages/bsd/%E7%81%B5%E6%84%9F%E7%94%9F%E6%88%90lora%E7%BC%A9%E7%95%A5%E5%9B%BE/yyjsf.png",
    modelType: "style",
    scenarios: ["商务"],
    categories: ["外绗羽绒服", "轻薄羽绒服"],
    submit_name: "优雅静奢风",
    show_name: "优雅静奢风",
    visible: true
  },
  "Miu系通勤": {
    en: "Miu series commuting",
    path: "https://inf-monkeys.oss-cn-beijing.aliyuncs.com/TemporaryImages/bsd/%E7%81%B5%E6%84%9F%E7%94%9F%E6%88%90lora%E7%BC%A9%E7%95%A5%E5%9B%BE/Miu.png",
    modelType: "style",
    scenarios: ["商务"],
    categories: ["外绗羽绒服", "内绗羽绒服", "轻薄羽绒服"],
    submit_name: "Miu系通勤",
    show_name: "Miu系通勤",
    visible: true
  },
  "26时尚童趣": {
    en: "kids_outer_puffer_playful",
    path: "https://inf-monkeys.oss-cn-beijing.aliyuncs.com/TemporaryImages/bsd/%E7%81%B5%E6%84%9F%E7%94%9F%E6%88%90lora%E7%BC%A9%E7%95%A5%E5%9B%BE/sstq.jpeg",
    modelType: "style",
    scenarios: ["童装"],
    categories: ["外绗羽绒服"],
    submit_name: "26时尚童趣",
    show_name: "26时尚童趣",
    visible: true
  },
  "复古学院风1": {
    en: "kids_outer_puffer_retro_academia_1",
    path: "https://inf-monkeys.oss-cn-beijing.aliyuncs.com/TemporaryImages/bsd/%E7%81%B5%E6%84%9F%E7%94%9F%E6%88%90lora%E7%BC%A9%E7%95%A5%E5%9B%BE/fgxyf1.jpeg",
    modelType: "style",
    scenarios: ["童装"],
    categories: ["外绗羽绒服"],
    submit_name: "复古学院风1",
    show_name: "复古学院风1",
    visible: true
  },
  "复古学院风2": {
    en: "kids_outer_puffer_retro_academia_2",
    path: "https://inf-monkeys.oss-cn-beijing.aliyuncs.com/TemporaryImages/bsd/%E7%81%B5%E6%84%9F%E7%94%9F%E6%88%90lora%E7%BC%A9%E7%95%A5%E5%9B%BE/fgxyf2.jpeg",
    modelType: "style",
    scenarios: ["童装"],
    categories: ["外绗羽绒服"],
    submit_name: "复古学院风2",
    show_name: "复古学院风2",
    visible: true
  },
  "26时尚泡芙": {
    en: "kids_fashion_puffer",
    path: "https://inf-monkeys.oss-cn-beijing.aliyuncs.com/TemporaryImages/bsd/%E7%81%B5%E6%84%9F%E7%94%9F%E6%88%90lora%E7%BC%A9%E7%95%A5%E5%9B%BE/TZ-ShiShangPaoFu.jpg",
    modelType: "style",
    scenarios: ["童装"],
    categories: ["外绗羽绒服"],
    submit_name: "26时尚泡芙",
    show_name: "26时尚泡芙",
    visible: true
  },
  "26复古条纹": {
    en: "kids_outer_puffer_retro_stripe",
    path: "https://inf-monkeys.oss-cn-beijing.aliyuncs.com/TemporaryImages/bsd/%E7%81%B5%E6%84%9F%E7%94%9F%E6%88%90lora%E7%BC%A9%E7%95%A5%E5%9B%BE/fugutiaowen.png",
    modelType: "style",
    scenarios: ["童装"],
    categories: ["外绗羽绒服"],
    submit_name: "26复古条纹",
    show_name: "26复古条纹",
    visible: true
  },
  "经典运动面包": {
    en: "kids_outer_puffer_classic_sport_bun",
    path: "https://inf-monkeys.oss-cn-beijing.aliyuncs.com/TemporaryImages/bsd/%E7%81%B5%E6%84%9F%E7%94%9F%E6%88%90lora%E7%BC%A9%E7%95%A5%E5%9B%BE/jdydmb.jpg",
    modelType: "style",
    scenarios: ["童装"],
    categories: ["外绗羽绒服"],
    submit_name: "经典运动面包",
    show_name: "经典运动面包",
    visible: true
  },
  "童装-冲锋衣": {
    en: "kids_inner_shell_speedy",
    path: "https://inf-monkeys.oss-cn-beijing.aliyuncs.com/TemporaryImages/bsd/%E7%81%B5%E6%84%9F%E7%94%9F%E6%88%90lora%E7%BC%A9%E7%95%A5%E5%9B%BE/tz-cfy.jpg",
    modelType: "style",
    scenarios: ["童装"],
    categories: ["内绗羽绒服", "冲锋衣"],
    submit_name: "童装-冲锋衣",
    show_name: "童装-冲锋衣",
    visible: true
  },
  "新式时尚泡芙": {
    en: "kids_outer_puffer_modern_puff",
    path: "https://inf-monkeys.oss-cn-beijing.aliyuncs.com/TemporaryImages/bsd/%E7%81%B5%E6%84%9F%E7%94%9F%E6%88%90lora%E7%BC%A9%E7%95%A5%E5%9B%BE/xssspf.jpg",
    modelType: "style",
    scenarios: ["童装"],
    categories: ["外绗羽绒服"],
    submit_name: "新式时尚泡芙",
    show_name: "新式时尚泡芙",
    visible: true
  },
  "科技运动风泡芙": {
    en: "kids_outer_puffer_tech_sport",
    path: "https://inf-monkeys.oss-cn-beijing.aliyuncs.com/TemporaryImages/bsd/%E7%81%B5%E6%84%9F%E7%94%9F%E6%88%90lora%E7%BC%A9%E7%95%A5%E5%9B%BE/kjydfpf.jpg",
    modelType: "style",
    scenarios: ["童装"],
    categories: ["外绗羽绒服"],
    submit_name: "科技运动风泡芙",
    show_name: "科技运动风泡芙",
    visible: true
  },
  "26叠变系列男": {
    en: "duobian26_male",
    path: "https://inf-monkeys.oss-cn-beijing.aliyuncs.com/TemporaryImages/bsd/%E7%81%B5%E6%84%9F%E7%94%9F%E6%88%90lora%E7%BC%A9%E7%95%A5%E5%9B%BE/diebianxilienan.jpg",
    modelType: "style",
    scenarios: ["户外"],
    categories: ["内绗羽绒服", "冲锋衣"],
    submit_name: "26叠变系列男",
    show_name: "26叠变系列男",
    visible: true
  },
  "26叠变系列女": {
    en: "duobian26_female",
    path: "https://inf-monkeys.oss-cn-beijing.aliyuncs.com/TemporaryImages/bsd/%E7%81%B5%E6%84%9F%E7%94%9F%E6%88%90lora%E7%BC%A9%E7%95%A5%E5%9B%BE/diebianxilienv.jpg",
    modelType: "style",
    scenarios: ["户外"],
    categories: ["内绗羽绒服", "冲锋衣"],
    submit_name: "26叠变系列女",
    show_name: "26叠变系列女",
    visible: true
  },
  "26叠变羽绒内胆": {
    en: "duobian26_down_core",
    path: "https://inf-monkeys.oss-cn-beijing.aliyuncs.com/TemporaryImages/bsd/%E7%81%B5%E6%84%9F%E7%94%9F%E6%88%90lora%E7%BC%A9%E7%95%A5%E5%9B%BE/diebianxilieneidan.png",
    modelType: "style",
    scenarios: ["户外"],
    categories: ["外绗羽绒服", "轻薄羽绒服"],
    submit_name: "26叠变羽绒内胆",
    show_name: "26叠变羽绒内胆",
    visible: true
  },
  "26高端户外男": {
    en: "highend26_outdoor_male",
    path: "https://inf-monkeys.oss-cn-beijing.aliyuncs.com/TemporaryImages/bsd/%E7%81%B5%E6%84%9F%E7%94%9F%E6%88%90lora%E7%BC%A9%E7%95%A5%E5%9B%BE/gaoduanhuwainan.jpg",
    modelType: "style",
    scenarios: ["户外"],
    categories: ["外绗羽绒服", "内绗羽绒服"],
    submit_name: "26高端户外男",
    show_name: "26高端户外男",
    visible: true
  },
  "26高端户外女": {
    en: "duedian26_outdoor_female",
    path: "https://inf-monkeys.oss-cn-beijing.aliyuncs.com/TemporaryImages/bsd/%E7%81%B5%E6%84%9F%E7%94%9F%E6%88%90lora%E7%BC%A9%E7%95%A5%E5%9B%BE/gaoduanhuwainv.jpg",
    modelType: "style",
    scenarios: ["户外"],
    categories: ["外绗羽绒服", "内绗羽绒服"],
    submit_name: "26高端户外女",
    show_name: "26高端户外女",
    visible: true
  },
  "26叠变拼接男": {
    en: "duobian26_splice_male",
    path: "https://inf-monkeys.oss-cn-beijing.aliyuncs.com/TemporaryImages/bsd/%E7%81%B5%E6%84%9F%E7%94%9F%E6%88%90lora%E7%BC%A9%E7%95%A5%E5%9B%BE/diebianpingjienan.png",
    modelType: "style",
    scenarios: ["户外"],
    categories: ["内绗羽绒服", "冲锋衣"],
    submit_name: "26叠变拼接男",
    show_name: "26叠变拼接男",
    visible: true
  },
  "25基础轻暖": {
    en: "basic_light_warm",
    path: "https://inf-monkeys.oss-cn-beijing.aliyuncs.com/TemporaryImages/bsd/%E7%81%B5%E6%84%9F%E7%94%9F%E6%88%90lora%E7%BC%A9%E7%95%A5%E5%9B%BE/JiChuQingNuan.jpg",
    modelType: "style",
    scenarios: ["休闲"],
    categories: ["外绗羽绒服", "轻薄羽绒服"],
    submit_name: "25基础轻暖",
    show_name: "25基础轻暖",
    visible: true
  },
  "25时尚运动": {
    en: "fashion_sport_style",
    path: "https://inf-monkeys.oss-cn-beijing.aliyuncs.com/TemporaryImages/bsd/%E7%81%B5%E6%84%9F%E7%94%9F%E6%88%90lora%E7%BC%A9%E7%95%A5%E5%9B%BE/ShiShangYunDong.jpg",
    modelType: "style",
    scenarios: ['运动'],
    categories: ["外绗羽绒服"],
    submit_name: "25时尚运动",
    show_name: "25时尚运动",
    visible: true
  },
  "25经典休闲": {
    en: "classic_casual_style",
    path: "https://inf-monkeys.oss-cn-beijing.aliyuncs.com/TemporaryImages/bsd/%E7%81%B5%E6%84%9F%E7%94%9F%E6%88%90lora%E7%BC%A9%E7%95%A5%E5%9B%BE/JingDianXiuXian.jpg",
    modelType: "style",
    scenarios: ["泡芙"],
    categories: ["外绗羽绒服"],
    submit_name: "25经典休闲",
    show_name: "25经典休闲",
    visible: true
  },
  "25经典商务": {
    en: "classic_business_style",
    path: "https://inf-monkeys.oss-cn-beijing.aliyuncs.com/TemporaryImages/bsd/%E7%81%B5%E6%84%9F%E7%94%9F%E6%88%90lora%E7%BC%A9%E7%95%A5%E5%9B%BE/JingDianShangWu.jpg",
    modelType: "style",
    scenarios: ["商务"],
    categories: ["外绗羽绒服", "内绗羽绒服"],
    submit_name: "25经典商务",
    show_name: "25经典商务",
    visible: true
  },
  "25经典极寒": {
    en: "classic_extreme_cold",
    path: "https://inf-monkeys.oss-cn-beijing.aliyuncs.com/TemporaryImages/bsd/%E7%81%B5%E6%84%9F%E7%94%9F%E6%88%90lora%E7%BC%A9%E7%95%A5%E5%9B%BE/JingdianJiHan.jpg",
    modelType: "style",
    scenarios: ["极寒"],
    categories: ["外绗羽绒服", "内绗羽绒服"],
    submit_name: "25经典极寒",
    show_name: "25经典极寒",
    visible: true
  },
  "25经典泡芙": {
    en: "classic_puffer_style",
    path: "https://inf-monkeys.oss-cn-beijing.aliyuncs.com/TemporaryImages/bsd/%E7%81%B5%E6%84%9F%E7%94%9F%E6%88%90lora%E7%BC%A9%E7%95%A5%E5%9B%BE/JingDianPaoFu.jpg",
    modelType: "style",
    scenarios: ["泡芙"],
    categories: ["外绗羽绒服"],
    submit_name: "25经典泡芙",
    show_name: "25经典泡芙",
    visible: true
  },
  "25高端户外": {
    en: "premium_outdoor",
    path: "https://inf-monkeys.oss-cn-beijing.aliyuncs.com/TemporaryImages/bsd/%E7%81%B5%E6%84%9F%E7%94%9F%E6%88%90lora%E7%BC%A9%E7%95%A5%E5%9B%BE/GaoDuanHuWai.jpg",
    modelType: "style",
    scenarios: ["户外"],
    categories: ["外绗羽绒服", "内绗羽绒服"],
    submit_name: "25高端户外",
    show_name: "25高端户外",
    visible: true
  },
  "25高端鹅绒": {
    en: "premium_goose_down",
    path: "https://inf-monkeys.oss-cn-beijing.aliyuncs.com/TemporaryImages/bsd/%E7%81%B5%E6%84%9F%E7%94%9F%E6%88%90lora%E7%BC%A9%E7%95%A5%E5%9B%BE/GaoDuanERong.jpg",
    modelType: "style",
    scenarios: ["休闲"],
    categories: ["轻薄羽绒服"],
    submit_name: "25高端鹅绒",
    show_name: "25高端鹅绒",
    visible: true
  },
  "始祖鸟轻户外": {
    en: "Archaeopteryx Light Outdoor",
    path: "https://inf-monkeys.oss-cn-beijing.aliyuncs.com/TemporaryImages/bsd/%E7%81%B5%E6%84%9F%E7%94%9F%E6%88%90lora%E7%BC%A9%E7%95%A5%E5%9B%BE/szn.png",
    modelType: "brand",
    scenarios: ["户外"],
    categories: ["功能外套", "冲锋衣"],
    submit_name: "始祖鸟轻户外",
    show_name: "始祖鸟轻户外",
    visible: true
  },
  "Bottega Veneta": {
    en: "Bottega Veneta",
    path: "https://inf-monkeys.oss-cn-beijing.aliyuncs.com/TemporaryImages/bsd/%E7%81%B5%E6%84%9F%E7%94%9F%E6%88%90lora%E7%BC%A9%E7%95%A5%E5%9B%BE/Bottega.png",
    modelType: "brand",
    scenarios: ["商务"],
    categories: ["外绗羽绒服", "内绗羽绒服", "轻薄羽绒服"],
    submit_name: "Bottega Veneta",
    show_name: "Bottega Veneta",
    visible: true
  },
  "Brunello Cucinelli": {
    en: "Brunello Cucinelli",
    path: "https://inf-monkeys.oss-cn-beijing.aliyuncs.com/TemporaryImages/bsd/%E7%81%B5%E6%84%9F%E7%94%9F%E6%88%90lora%E7%BC%A9%E7%95%A5%E5%9B%BE/Brunello.png",
    modelType: "brand",
    scenarios: ["商务"],
    categories: ["外绗羽绒服", "内绗羽绒服", "轻薄羽绒服"],
    submit_name: "Brunello Cucinelli",
    show_name: "Brunello Cucinelli",
    visible: true
  },
  "Loro Piana": {
    en: "Loro Piana",
    path: "https://inf-monkeys.oss-cn-beijing.aliyuncs.com/TemporaryImages/bsd/%E7%81%B5%E6%84%9F%E7%94%9F%E6%88%90lora%E7%BC%A9%E7%95%A5%E5%9B%BE/Loro.png",
    modelType: "brand",
    scenarios: ["商务"],
    categories: ["外绗羽绒服", "内绗羽绒服", "轻薄羽绒服"],
    submit_name: "Loro Piana",
    show_name: "Loro Piana",
    visible: true
  },
  "MO&CO羽绒": {
    en: "MO&CO down",
    path: "https://inf-monkeys.oss-cn-beijing.aliyuncs.com/TemporaryImages/bsd/%E7%81%B5%E6%84%9F%E7%94%9F%E6%88%90lora%E7%BC%A9%E7%95%A5%E5%9B%BE/MOCO%E7%BE%BD%E7%BB%92.png",
    modelType: "brand",
    scenarios: ["童装"],
    categories: ["外绗羽绒服"],
    submit_name: "MO&CO羽绒",
    show_name: "MO&CO羽绒",
    visible: true
  },
  "高梵小童": {
    en: "Gao Fan Xiaotong",
    path: "https://inf-monkeys.oss-cn-beijing.aliyuncs.com/TemporaryImages/bsd/%E7%81%B5%E6%84%9F%E7%94%9F%E6%88%90lora%E7%BC%A9%E7%95%A5%E5%9B%BE/高梵小童.png",
    modelType: "brand",
    scenarios: ["童装"],
    categories: ["外绗羽绒服"],
    submit_name: "高梵小童",
    show_name: "高梵小童",
    visible: true
  },
  "JNBY小童": {
    en: "JNBY",
    path: "https://inf-monkeys.oss-cn-beijing.aliyuncs.com/TemporaryImages/bsd/%E7%81%B5%E6%84%9F%E7%94%9F%E6%88%90lora%E7%BC%A9%E7%95%A5%E5%9B%BE/JNBY小童.png",
    modelType: "brand",
    scenarios: ["童装"],
    categories: ["外绗羽绒服"],
    submit_name: "JNBY小童",
    show_name: "JNBY小童",
    visible: true
  },
  "Ralph Lauren": {
    en: "Ralph Lauren",
    path: "https://inf-monkeys.oss-cn-beijing.aliyuncs.com/TemporaryImages/bsd/%E7%81%B5%E6%84%9F%E7%94%9F%E6%88%90lora%E7%BC%A9%E7%95%A5%E5%9B%BE/Ralph%20Lauren.png",
    modelType: "brand",
    scenarios: ["商务"],
    categories: ["外绗羽绒服", "内绗羽绒服", "轻薄羽绒服"],
    submit_name: "Ralph Lauren",
    show_name: "Ralph Lauren",
    visible: true
  },
  "kolon可隆": {
    en: "kolon",
    path: "https://inf-monkeys.oss-cn-beijing.aliyuncs.com/TemporaryImages/bsd/%E7%81%B5%E6%84%9F%E7%94%9F%E6%88%90lora%E7%BC%A9%E7%95%A5%E5%9B%BE/kolon.png",
    modelType: "brand",
    scenarios: ["户外"],
    categories: ["功能外套", "冲锋衣"],
    submit_name: "kolon可隆",
    show_name: "kolon可隆",
    visible: true
  }
};

export const allowedModelIds = ['style', 'brand'] as const;

// 基于 MODEL_LIBRARY 动态生成场景/品类映射，避免依赖旧静态数据
const visibleModels = Object.values(MODEL_LIBRARY).filter((item) => item.visible !== false);

const buildSceneMap = () => {
  const map: Record<string, { styleModels: string[]; brandModels: string[] }> = {};
  visibleModels.forEach((item) => {
    item.scenarios.forEach((scene) => {
      if (!map[scene]) {
        map[scene] = { styleModels: [], brandModels: [] };
      }
      if (item.modelType === 'style') {
        map[scene].styleModels.push(item.en);
      } else {
        map[scene].brandModels.push(item.en);
      }
    });
  });
  return map;
};

const buildCategoryMap = () => {
  const map: Record<string, { styleValues: string[]; brandValues: string[] }> = {};
  visibleModels.forEach((item) => {
    item.categories.forEach((cat) => {
      if (!map[cat]) {
        map[cat] = { styleValues: [], brandValues: [] };
      }
      if (item.modelType === 'style') {
        map[cat].styleValues.push(item.en);
      } else {
        map[cat].brandValues.push(item.en);
      }
    });
  });
  return map;
};

export const SCENE_MODEL_MAP = buildSceneMap();
export const CATEGORY_MODEL_MAP = buildCategoryMap();

export const derivedScenarios = Array.from(new Set(visibleModels.flatMap((m) => m.scenarios)));
export const derivedCategories = Array.from(new Set(visibleModels.flatMap((m) => m.categories)));

export const defaultOptions: InspirationGenerationOptions = {
  title: '创意描述',
  description: '通过文字描述生成图片或使用提示词字典提升生成效果',
  scenarios: derivedScenarios,
  categories: derivedCategories,
  flavors: ['更多'],
  prompt:
    '',
  models: [
    { id: 'style', title: '风格 Style', subtitle: 'Style' },
    { id: 'brand', title: '品牌 Brand', subtitle: 'Brand' },
  ],
};
