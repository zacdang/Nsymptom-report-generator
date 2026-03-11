// Questionnaire data constants - Auto-generated from 体质解析报告.xlsx

export interface SymptomItem {
  name: string;
  category: 'head' | 'body' | 'limbs' | 'mental';
  subcategory?: string;
  femaleOnly?: boolean;
}

export const HEAD_SYMPTOMS: SymptomItem[] = [
  { name: "眼睛疲劳", category: "head" },
  { name: "充血", category: "head" },
  { name: "易流泪畏光", category: "head" },
  { name: "眼袋", category: "head" },
  { name: "头皮屑", category: "head" },
  { name: "脸过油", category: "head" },
  { name: "口干舌燥", category: "head" },
  { name: "口腔溃疡", category: "head" },
  { name: "脂溢性脱发", category: "head" },
  { name: "白头发", category: "head" },
  { name: "咽炎", category: "head" },
  { name: "口角炎", category: "head" },
  { name: "口咽干痒", category: "head" },
  { name: "口臭", category: "head" },
  { name: "偏头痛", category: "head" },
  { name: "过敏性鼻炎", category: "head" },
  { name: "肩颈酸痛", category: "head" },
  { name: "长斑", category: "head" },
  { name: "扁平疣", category: "head" },
  { name: "牙龈出血", category: "head" },
  { name: "耳鸣", category: "head" },
  { name: "咳嗽", category: "head" },
  { name: "流鼻血", category: "head" },
  { name: "舌边齿痕", category: "head" },
  { name: "飞蚊症", category: "head" },
  { name: "眼角皱纹", category: "head" },
  { name: "牙齿酸痛", category: "head" },
];

export const BODY_SYMPTOMS: SymptomItem[] = [
  { name: "皮肤无光泽", category: "body" },
  { name: "皮肤爱出油", category: "body" },
  { name: "皮肤粗糙", category: "body" },
  { name: "黑头粉刺", category: "body" },
  { name: "消化不良", category: "body" },
  { name: "腹胀腹泻", category: "body" },
  { name: "嗝气反酸", category: "body" },
  { name: "外阴瘙痒", category: "body", femaleOnly: true },
  { name: "内外痔疮", category: "body" },
  { name: "黑粪", category: "body" },
  { name: "便秘", category: "body" },
  { name: "心慌胸闷", category: "body" },
  { name: "贫血", category: "body" },
  { name: "手脚冰冷", category: "body" },
  { name: "牛皮癣", category: "body" },
  { name: "少汗或无汗", category: "body" },
  { name: "皮肤过敏", category: "body" },
  { name: "痛经", category: "body", femaleOnly: true },
  { name: "心律不齐", category: "body" },
  { name: "尿频", category: "body" },
  { name: "肾炎", category: "body" },
  { name: "盗汗", category: "body" },
  { name: "肋间神经痛", category: "body" },
  { name: "宫颈息肉", category: "body", femaleOnly: true },
  { name: "子宫肌瘤", category: "body", femaleOnly: true },
];

export const LIMBS_SYMPTOMS: SymptomItem[] = [
  { name: "静脉曲张", category: "limbs" },
  { name: "指甲变形", category: "limbs" },
  { name: "手指关节黑", category: "limbs" },
  { name: "手足脱皮", category: "limbs" },
  { name: "关节疼痛", category: "limbs" },
  { name: "囊肿", category: "limbs" },
  { name: "结节", category: "limbs" },
  { name: "肌肉酸痛", category: "limbs" },
  { name: "皮下出血点", category: "limbs" },
  { name: "游走性疼痛", category: "limbs" },
  { name: "身体异味", category: "limbs" },
  { name: "水肿", category: "limbs" },
  { name: "脚气", category: "limbs" },
  { name: "手脚麻木", category: "limbs" },
  { name: "脊柱侧弯", category: "limbs" },
  { name: "手肘关节粗糙", category: "limbs" },
];

export const MENTAL_SYMPTOMS: SymptomItem[] = [
  { name: "疲倦乏力", category: "mental" },
  { name: "失眠", category: "mental" },
  { name: "记忆力下降", category: "mental" },
  { name: "生气", category: "mental" },
  { name: "不耐烦", category: "mental" },
  { name: "压力大", category: "mental" },
  { name: "抑郁", category: "mental" },
  { name: "神经衰弱", category: "mental" },
  { name: "含胸驼背", category: "mental" },
  { name: "上肢体前屈困难", category: "mental" },
  { name: "睡眠质量差", category: "mental" },
  { name: "多梦", category: "mental" },
  { name: "容易打瞌睡", category: "mental" },
  { name: "郁闷", category: "mental" },
  { name: "熬夜", category: "mental" },
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
  { value: "睡前吃东西", label: "睡前吃东西" },
  { value: "赖床", label: "赖床" },
  { value: "吸烟", label: "吸烟" },
];

export const DIETARY_PREFERENCES = [
  { value: "喜甜", label: "喜甜" },
  { value: "喜酸", label: "喜酸" },
  { value: "喜辛辣", label: "喜辛辣" },
  { value: "喜厚味", label: "喜厚味" },
  { value: "饮酒", label: "饮酒" },
  { value: "素食", label: "素食" },
  { value: "喝饮料", label: "喝饮料" },
  { value: "饭店为主", label: "饭店为主" },
  { value: "吃饭速度快", label: "吃饭速度快" },
  { value: "三餐不规律", label: "三餐不规律" },
  { value: "吃零食", label: "吃零食" },
  { value: "吃加工食品", label: "吃加工食品" },
];

export const WORK_ENVIRONMENT = [
  { value: "空调环境", label: "空调环境" },
  { value: "化工制剂", label: "化工制剂" },
  { value: "噪声污染", label: "噪声污染" },
  { value: "露天作业", label: "露天作业" },
  { value: "黑白颠倒", label: "黑白颠倒" },
  { value: "经常出差", label: "经常出差" },
  { value: "体力劳动", label: "体力劳动" },
  { value: "办公一族", label: "办公一族" },
  { value: "站立时间长", label: "站立时间长" },
];

export const MEDICAL_HISTORY = [
  { value: "荨麻疹", label: "荨麻疹" },
  { value: "胃炎", label: "胃炎" },
  { value: "胃溃疡", label: "胃溃疡" },
  { value: "胆囊炎", label: "胆囊炎" },
  { value: "肝炎", label: "肝炎" },
  { value: "高血压", label: "高血压" },
  { value: "痛风", label: "痛风" },
  { value: "心绞痛", label: "心绞痛" },
  { value: "肾结石", label: "肾结石" },
  { value: "哮喘", label: "哮喘" },
  { value: "支气管炎", label: "支气管炎" },
  { value: "风湿性关节炎", label: "风湿性关节炎" },
  { value: "类风湿性关节炎", label: "类风湿性关节炎" },
  { value: "囊肿", label: "囊肿" },
  { value: "更年期", label: "更年期", femaleOnly: true },
  { value: "肌瘤", label: "肌瘤" },
  { value: "结节", label: "结节" },
  { value: "甲亢", label: "甲亢" },
  { value: "甲减", label: "甲减" },
  { value: "胃息肉", label: "胃息肉" },
  { value: "肠息肉", label: "肠息肉" },
  { value: "子宫内膜息肉", label: "子宫内膜息肉", femaleOnly: true },
  { value: "胆囊息肉", label: "胆囊息肉" },
  { value: "鼻息肉", label: "鼻息肉" },
  { value: "声带息肉", label: "声带息肉" },
  { value: "湿疹", label: "湿疹" },
  { value: "胆结石", label: "胆结石" },
  { value: "胰腺炎", label: "胰腺炎" },
  { value: "脂肪肝", label: "脂肪肝" },
  { value: "肝硬化", label: "肝硬化" },
];
