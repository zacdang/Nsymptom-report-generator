// Questionnaire data constants

export interface SymptomItem {
  name: string;
  category: 'head' | 'body' | 'limbs' | 'mental';
  subcategory?: string;
}

export const HEAD_SYMPTOMS: SymptomItem[] = [
  // 眼睛相关
  { name: "眼睛疲劳", category: "head", subcategory: "眼睛相关" },
  { name: "眼睛干涩", category: "head", subcategory: "眼睛相关" },
  { name: "眼睛充血", category: "head", subcategory: "眼睛相关" },
  { name: "眼睛易流泪畏光", category: "head", subcategory: "眼睛相关" },
  { name: "眼袋", category: "head", subcategory: "眼睛相关" },
  { name: "眼角皱纹", category: "head", subcategory: "眼睛相关" },
  { name: "飞蚊症", category: "head", subcategory: "眼睛相关" },
  
  // 头发相关
  { name: "头皮屑", category: "head", subcategory: "头发相关" },
  { name: "易掉发", category: "head", subcategory: "头发相关" },
  { name: "白头发", category: "head", subcategory: "头发相关" },
  
  // 口腔相关
  { name: "口干舌燥", category: "head", subcategory: "口腔相关" },
  { name: "口腔溃疡", category: "head", subcategory: "口腔相关" },
  { name: "口臭", category: "head", subcategory: "口腔相关" },
  { name: "口角炎", category: "head", subcategory: "口腔相关" },
  { name: "口咽干痒", category: "head", subcategory: "口腔相关" },
  { name: "咽炎", category: "head", subcategory: "口腔相关" },
  { name: "牙龈出血", category: "head", subcategory: "口腔相关" },
  { name: "牙齿酸痛", category: "head", subcategory: "口腔相关" },
  { name: "舌头边缘齿印", category: "head", subcategory: "口腔相关" },
  
  // 其他头部症状
  { name: "偏头痛", category: "head", subcategory: "其他" },
  { name: "过敏性鼻炎", category: "head", subcategory: "其他" },
  { name: "青春痘", category: "head", subcategory: "其他" },
  { name: "颈肩酸痛", category: "head", subcategory: "其他" },
  { name: "脸过油", category: "head", subcategory: "其他" },
  { name: "耳鸣", category: "head", subcategory: "其他" },
  { name: "咳嗽", category: "head", subcategory: "其他" },
  { name: "鼻血", category: "head", subcategory: "其他" },
  { name: "鼻塞", category: "head", subcategory: "其他" },
  { name: "长斑", category: "head", subcategory: "其他" },
  { name: "扁平疣", category: "head", subcategory: "其他" },
];

export const BODY_SYMPTOMS: SymptomItem[] = [
  // 皮肤相关
  { name: "皮肤无光泽", category: "body", subcategory: "皮肤相关" },
  { name: "皮肤粗糙", category: "body", subcategory: "皮肤相关" },
  { name: "皮肤过敏", category: "body", subcategory: "皮肤相关" },
  { name: "油性皮肤", category: "body", subcategory: "皮肤相关" },
  { name: "黑头粉刺", category: "body", subcategory: "皮肤相关" },
  
  // 消化系统
  { name: "消化不良", category: "body", subcategory: "消化系统" },
  { name: "易腹泻", category: "body", subcategory: "消化系统" },
  { name: "胀气", category: "body", subcategory: "消化系统" },
  { name: "便秘", category: "body", subcategory: "消化系统" },
  { name: "黑粪", category: "body", subcategory: "消化系统" },
  { name: "反酸", category: "body", subcategory: "消化系统" },
  
  // 心血管
  { name: "胸闷", category: "body", subcategory: "心血管" },
  { name: "贫血", category: "body", subcategory: "心血管" },
  { name: "心律不齐", category: "body", subcategory: "心血管" },
  
  // 妇科相关
  { name: "经期不规律", category: "body", subcategory: "妇科相关" },
  { name: "痛经", category: "body", subcategory: "妇科相关" },
  { name: "外阴瘙痒", category: "body", subcategory: "妇科相关" },
  { name: "宫颈息肉", category: "body", subcategory: "妇科相关" },
  { name: "白带多", category: "body", subcategory: "妇科相关" },
  { name: "经前胸胀", category: "body", subcategory: "妇科相关" },
  { name: "盆腔积液", category: "body", subcategory: "妇科相关" },
  
  // 其他身体症状
  { name: "伤口不易愈合", category: "body", subcategory: "其他" },
  { name: "眩晕", category: "body", subcategory: "其他" },
  { name: "骨质疏松", category: "body", subcategory: "其他" },
  { name: "易感冒", category: "body", subcategory: "其他" },
  { name: "尿频", category: "body", subcategory: "其他" },
  { name: "腰酸腰痛", category: "body", subcategory: "其他" },
  { name: "肾炎", category: "body", subcategory: "其他" },
  { name: "内外痔疮", category: "body", subcategory: "其他" },
  { name: "盗汗", category: "body", subcategory: "其他" },
  { name: "肋间神经痛", category: "body", subcategory: "其他" },
  { name: "水牛背", category: "body", subcategory: "其他" },
  { name: "上身前屈手指触不到地面", category: "body", subcategory: "其他" },
  { name: "含胸驼背", category: "body", subcategory: "其他" },
  { name: "仰卧起坐很难", category: "body", subcategory: "其他" },
  { name: "不爱出汗", category: "body", subcategory: "其他" },
];

export const LIMBS_SYMPTOMS: SymptomItem[] = [
  { name: "手脚冰冷", category: "limbs" },
  { name: "指甲变型", category: "limbs" },
  { name: "指头关节黑色", category: "limbs" },
  { name: "容易抽搐麻木", category: "limbs" },
  { name: "静脉曲张", category: "limbs" },
  { name: "手肘关节粗糙", category: "limbs" },
  { name: "关节疼痛", category: "limbs" },
  { name: "肌肉酸痛", category: "limbs" },
  { name: "皮下出血点", category: "limbs" },
  { name: "手足脱皮", category: "limbs" },
  { name: "游走性疼痛", category: "limbs" },
  { name: "身体异味", category: "limbs" },
  { name: "下肢浮肿", category: "limbs" },
  { name: "脚气", category: "limbs" },
  { name: "脊柱侧弯", category: "limbs" },
  { name: "肥胖", category: "limbs" },
];

export const MENTAL_SYMPTOMS: SymptomItem[] = [
  { name: "疲倦乏力", category: "mental" },
  { name: "失眠", category: "mental" },
  { name: "睡眠质量差", category: "mental" },
  { name: "多梦", category: "mental" },
  { name: "容易打瞌睡", category: "mental" },
  { name: "记忆力减退", category: "mental" },
  { name: "易生气不耐烦", category: "mental" },
  { name: "郁闷", category: "mental" },
  { name: "熬夜", category: "mental" },
  { name: "压力大", category: "mental" },
  { name: "神经衰弱", category: "mental" },
  { name: "抑郁", category: "mental" },
];

export const AGE_RANGES = [
  "18岁以下",
  "18~25",
  "26~30",
  "31~40",
  "41~50",
  "51~60",
  "60以上",
];

export const LIFESTYLE_HABITS = [
  { value: "eat_before_sleep", label: "睡前吃东西" },
  { value: "stay_in_bed", label: "赖床" },
  { value: "smoking", label: "吸烟" },
];

export const DIETARY_PREFERENCES = [
  { value: "sweet", label: "喜甜" },
  { value: "sour", label: "喜酸" },
  { value: "spicy", label: "喜辛辣" },
  { value: "heavy_flavor", label: "喜厚味" },
  { value: "alcohol", label: "饮酒" },
  { value: "vegetarian", label: "素食" },
  { value: "drinks", label: "喝饮料" },
  { value: "restaurants", label: "饭店为主" },
  { value: "fast_eating", label: "吃饭速度快" },
  { value: "irregular_meals", label: "三餐不规律" },
  { value: "snacks", label: "吃零食" },
  { value: "processed_foods", label: "吃加工食品" },
];

export const WORK_ENVIRONMENT = [
  { value: "air_conditioned", label: "空调环境" },
  { value: "chemicals", label: "化工制剂" },
  { value: "noise", label: "噪声污染" },
  { value: "outdoor", label: "露天作业" },
  { value: "night_shift", label: "黑白颠倒" },
  { value: "frequent_travel", label: "经常出差" },
  { value: "physical_labor", label: "体力劳动" },
  { value: "office_work", label: "办公一族" },
  { value: "long_standing", label: "站立时间长" },
];

export const MEDICAL_HISTORY = [
  { value: "urticaria", label: "荨麻疹" },
  { value: "eczema", label: "湿疹" },
  { value: "gastritis", label: "胃炎" },
  { value: "gastric_ulcer", label: "胃溃疡" },
  { value: "cholecystitis", label: "胆囊炎" },
  { value: "gallstones", label: "胆结石" },
  { value: "pancreatitis", label: "胰腺炎" },
  { value: "hepatitis", label: "肝炎" },
  { value: "fatty_liver", label: "脂肪肝" },
  { value: "cirrhosis", label: "肝硬化" },
  { value: "hyperlipidemia", label: "高血脂" },
  { value: "hyperglycemia", label: "高血糖" },
  { value: "hypertension", label: "高血压" },
  { value: "gout", label: "尿酸高/痛风" },
  { value: "angina", label: "心绞痛" },
  { value: "kidney_stones", label: "肾结石" },
  { value: "asthma", label: "哮喘" },
  { value: "bronchitis", label: "支气管炎" },
  { value: "arthritis", label: "（类）风湿性关节炎" },
  { value: "menopause", label: "更年期综合症" },
  { value: "uterine_fibroids", label: "子宫肌瘤" },
  { value: "hyperthyroidism", label: "甲亢" },
  { value: "hypothyroidism", label: "甲减" },
  { value: "cyst", label: "囊肿" },
  { value: "nodules", label: "结节" },
  { value: "polyps", label: "息肉" },
];
