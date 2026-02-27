import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { HumanBodyDiagram } from "../components/HumanBodyDiagram";
import {
  HEAD_SYMPTOMS,
  BODY_SYMPTOMS,
  LIMBS_SYMPTOMS,
  MENTAL_SYMPTOMS,
  AGE_RANGES,
  LIFESTYLE_HABITS,
  DIETARY_PREFERENCES,
  WORK_ENVIRONMENT,
  MEDICAL_HISTORY,
  type SymptomItem,
} from "../data/questionnaireData";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Textarea } from "../components/ui/textarea";
import { Checkbox } from "../components/ui/checkbox";
import { toast } from "sonner";
import { useLocation } from "wouter";
import { trpc } from "../lib/trpc";

type Step = 1 | 2 | 3;
type BodyPart = 'head' | 'body' | 'limbs' | 'mental' | null;

interface FormData {
  name: string;
  gender: 'male' | 'female' | '';
  ageRange: string;
  height: string;
  weight: string;
  waist: string;
  bloodPressure: string;
  bloodSugar: string;
  bodyFat: string;
  selectedSymptoms: string[];
  exerciseParticipation: string;
  exerciseType: string;
  exerciseFrequency: string;
  wakeTime: string;
  napTime: string;
  sleepTime: string;
  hungriestTime: string;
  mostTiredTime: string;
  lifestyleHabits: string[];
  breakfastTime: string;
  breakfastHas: string;
  lunchTime: string;
  lunchHas: string;
  dinnerTime: string;
  dinnerHas: string;
  lateNightSnackTime: string;
  lateNightSnackHas: string;
  dietaryPreferences: string[];
  unsuitableFoods: string;
  fruitFrequency: string;
  coarseGrainFrequency: string;
  workEnvironment: string[];
  medicationsAllergies: string;
  medicalHistory: string[];
  additionalNotes: string;
}

const stepLabels = ["基本信息", "症状选择", "生活习惯"];

export default function Questionnaire() {
  const [, setLocation] = useLocation();
  const [currentStep, setCurrentStep] = useState<Step>(1);
  const [selectedBodyPart, setSelectedBodyPart] = useState<BodyPart>(null);
  const [formData, setFormData] = useState<FormData>({
    name: "",
    gender: "",
    ageRange: "",
    height: "",
    weight: "",
    waist: "",
    bloodPressure: "",
    bloodSugar: "",
    bodyFat: "",
    selectedSymptoms: [],
    exerciseParticipation: "",
    exerciseType: "",
    exerciseFrequency: "",
    wakeTime: "",
    napTime: "",
    sleepTime: "",
    hungriestTime: "",
    mostTiredTime: "",
    lifestyleHabits: [],
    breakfastTime: "",
    breakfastHas: "",
    lunchTime: "",
    lunchHas: "",
    dinnerTime: "",
    dinnerHas: "",
    lateNightSnackTime: "",
    lateNightSnackHas: "",
    dietaryPreferences: [],
    unsuitableFoods: "",
    fruitFrequency: "",
    coarseGrainFrequency: "",
    workEnvironment: [],
    medicationsAllergies: "",
    medicalHistory: [],
    additionalNotes: "",
  });

  const isMale = formData.gender === 'male';
  const isFemale = formData.gender === 'female';

  // Filter symptoms based on gender
  const filterByGender = (symptoms: SymptomItem[]) => {
    if (isMale) {
      return symptoms.filter(s => !s.femaleOnly);
    }
    return symptoms;
  };

  // Filter medical history based on gender
  const filteredMedicalHistory = isMale
    ? MEDICAL_HISTORY.filter(m => !(m as any).femaleOnly)
    : MEDICAL_HISTORY;

  const handleSymptomToggle = (symptomName: string) => {
    setFormData(prev => ({
      ...prev,
      selectedSymptoms: prev.selectedSymptoms.includes(symptomName)
        ? prev.selectedSymptoms.filter(s => s !== symptomName)
        : [...prev.selectedSymptoms, symptomName]
    }));
  };

  const handleNext = () => {
    if (currentStep === 1) {
      if (!formData.name || !formData.gender || !formData.ageRange) {
        toast.error("请填写必填项：姓名、性别、年龄范围");
        return;
      }
    }
    if (currentStep < 3) {
      setCurrentStep((prev) => (prev + 1) as Step);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep((prev) => (prev - 1) as Step);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const submitMutation = trpc.questionnaire.submit.useMutation({
    onSuccess: () => {
      toast.success("问卷提交成功！感谢您的填写。");
      setTimeout(() => setLocation("/"), 1500);
    },
    onError: (error: any) => {
      toast.error(error.message || "提交失败，请重试");
    },
  });

  const handleSubmit = async () => {
    if (!formData.name || !formData.gender || !formData.ageRange) {
      toast.error("请填写必填项：姓名、性别、年龄范围");
      return;
    }

    const symptomsWithCategory = formData.selectedSymptoms.map(name => {
      const allSymptoms = [...HEAD_SYMPTOMS, ...BODY_SYMPTOMS, ...LIMBS_SYMPTOMS, ...MENTAL_SYMPTOMS];
      const symptom = allSymptoms.find(s => s.name === name);
      return { name, category: symptom?.category || 'body' };
    });

    submitMutation.mutate({
      ...formData,
      selectedSymptoms: symptomsWithCategory,
    });
  };

  const getCurrentSymptoms = (): SymptomItem[] => {
    switch (selectedBodyPart) {
      case 'head': return filterByGender(HEAD_SYMPTOMS);
      case 'body': return filterByGender(BODY_SYMPTOMS);
      case 'limbs': return filterByGender(LIMBS_SYMPTOMS);
      case 'mental': return filterByGender(MENTAL_SYMPTOMS);
      default: return [];
    }
  };

  const groupSymptomsBySubcategory = (symptoms: SymptomItem[]) => {
    const grouped: Record<string, SymptomItem[]> = {};
    symptoms.forEach(symptom => {
      const key = symptom.subcategory || '其他';
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(symptom);
    });
    return grouped;
  };

  const partTitles: Record<string, string> = {
    head: '头部症状',
    body: '身体症状',
    limbs: '四肢症状',
    mental: '精神状态',
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Top Bar */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between mb-3">
            <h1 className="text-xl font-bold text-slate-800 tracking-tight">健康评估问卷</h1>
            <span className="text-sm text-slate-400">{currentStep} / 3</span>
          </div>

          {/* Progress Bar - Fixed */}
          <div className="flex items-center gap-0">
            {[1, 2, 3].map((step, index) => (
              <div key={step} className="flex items-center flex-1">
                <div className="flex items-center gap-2 shrink-0">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-all duration-300 ${
                      currentStep > step
                        ? 'bg-emerald-500 text-white'
                        : currentStep === step
                        ? 'bg-blue-600 text-white shadow-md shadow-blue-200'
                        : 'bg-slate-200 text-slate-400'
                    }`}
                  >
                    {currentStep > step ? (
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    ) : step}
                  </div>
                  <span className={`text-sm font-medium hidden sm:inline ${
                    currentStep >= step ? 'text-slate-700' : 'text-slate-400'
                  }`}>
                    {stepLabels[index]}
                  </span>
                </div>
                {index < 2 && (
                  <div className="flex-1 mx-3">
                    <div className="h-0.5 bg-slate-200 rounded-full overflow-hidden">
                      <motion.div
                        className="h-full bg-blue-600 rounded-full"
                        initial={{ width: '0%' }}
                        animate={{ width: currentStep > step ? '100%' : '0%' }}
                        transition={{ duration: 0.4, ease: 'easeInOut' }}
                      />
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-6 py-8">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.25 }}
          >
            {/* ===== STEP 1: Basic Info ===== */}
            {currentStep === 1 && (
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
                <div className="px-8 py-6 border-b border-slate-100">
                  <h2 className="text-lg font-semibold text-slate-800">基本信息</h2>
                  <p className="text-sm text-slate-500 mt-1">请填写您的基本健康数据</p>
                </div>
                <div className="px-8 py-6 space-y-6">
                  {/* Name */}
                  <div>
                    <Label className="text-sm font-medium text-slate-700">姓名 <span className="text-red-500">*</span></Label>
                    <Input
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="mt-1.5"
                    />
                  </div>

                  {/* Gender */}
                  <div>
                    <Label className="text-sm font-medium text-slate-700">性别 <span className="text-red-500">*</span></Label>
                    <div className="flex gap-3 mt-2">
                      {[
                        { value: 'male', label: '男' },
                        { value: 'female', label: '女' },
                      ].map(opt => (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => setFormData({ ...formData, gender: opt.value as 'male' | 'female' })}
                          className={`flex-1 py-3 rounded-lg border-2 text-sm font-semibold transition-all duration-200 ${
                            formData.gender === opt.value
                              ? 'border-blue-600 bg-blue-50 text-blue-700'
                              : 'border-slate-200 bg-white text-slate-500 hover:border-slate-300'
                          }`}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Age Range */}
                  <div>
                    <Label className="text-sm font-medium text-slate-700">年龄范围 <span className="text-red-500">*</span></Label>
                    <select
                      value={formData.ageRange}
                      onChange={(e) => setFormData({ ...formData, ageRange: e.target.value })}
                      className="mt-1.5 w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">请选择</option>
                      {AGE_RANGES.map(range => (
                        <option key={range} value={range}>{range}</option>
                      ))}
                    </select>
                  </div>

                  {/* Physical Measurements */}
                  <div>
                    <Label className="text-sm font-medium text-slate-700 mb-3 block">身体指标</Label>
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <span className="text-xs text-slate-500">身高 (cm)</span>
                        <Input
                          type="number"
                          value={formData.height}
                          onChange={(e) => setFormData({ ...formData, height: e.target.value })}
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <span className="text-xs text-slate-500">体重 (kg)</span>
                        <Input
                          type="number"
                          value={formData.weight}
                          onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <span className="text-xs text-slate-500">腰围 (cm)</span>
                        <Input
                          type="number"
                          value={formData.waist}
                          onChange={(e) => setFormData({ ...formData, waist: e.target.value })}
                          className="mt-1"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Health Indicators */}
                  <div>
                    <Label className="text-sm font-medium text-slate-700 mb-3 block">健康指标</Label>
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <span className="text-xs text-slate-500">血压 (mmHg)</span>
                        <Input
                          value={formData.bloodPressure}
                          onChange={(e) => setFormData({ ...formData, bloodPressure: e.target.value })}
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <span className="text-xs text-slate-500">血糖 (mmol/l)</span>
                        <Input
                          value={formData.bloodSugar}
                          onChange={(e) => setFormData({ ...formData, bloodSugar: e.target.value })}
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <span className="text-xs text-slate-500">体脂率 (%)</span>
                        <Input
                          value={formData.bodyFat}
                          onChange={(e) => setFormData({ ...formData, bodyFat: e.target.value })}
                          className="mt-1"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ===== STEP 2: Symptoms ===== */}
            {currentStep === 2 && (
              <div className="grid md:grid-cols-5 gap-6">
                {/* Left: Body Diagram */}
                <div className="md:col-span-2">
                  <div className="bg-white rounded-xl border border-slate-200 shadow-sm sticky top-28">
                    <div className="px-6 py-4 border-b border-slate-100">
                      <h2 className="text-lg font-semibold text-slate-800">选择部位</h2>
                      <p className="text-sm text-slate-500 mt-1">点击身体部位查看相关症状</p>
                    </div>
                    <div className="px-4 py-6 flex justify-center">
                      <HumanBodyDiagram
                        gender={formData.gender as 'male' | 'female'}
                        selectedPart={selectedBodyPart}
                        onPartClick={setSelectedBodyPart}
                      />
                    </div>
                  </div>
                </div>

                {/* Right: Symptom Selection */}
                <div className="md:col-span-3">
                  <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
                    <div className="px-6 py-4 border-b border-slate-100">
                      <h2 className="text-lg font-semibold text-slate-800">
                        {selectedBodyPart ? partTitles[selectedBodyPart] : '症状选择'}
                      </h2>
                      {!selectedBodyPart && (
                        <p className="text-sm text-slate-500 mt-1">请先在左侧选择身体部位</p>
                      )}
                    </div>
                    <div className="px-6 py-4">
                      <AnimatePresence mode="wait">
                        {selectedBodyPart ? (
                          <motion.div
                            key={selectedBodyPart}
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -8 }}
                            transition={{ duration: 0.2 }}
                            className="space-y-5"
                          >
                            {Object.entries(groupSymptomsBySubcategory(getCurrentSymptoms())).map(([subcategory, symptoms]) => (
                              <div key={subcategory}>
                                {subcategory !== '其他' && symptoms.length > 0 && (
                                  <div className="flex items-center gap-2 mb-3">
                                    <div className="h-px flex-1 bg-slate-100" />
                                    <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{subcategory}</span>
                                    <div className="h-px flex-1 bg-slate-100" />
                                  </div>
                                )}
                                <div className="grid grid-cols-2 gap-1.5">
                                  {symptoms.map((symptom) => {
                                    const isChecked = formData.selectedSymptoms.includes(symptom.name);
                                    return (
                                      <motion.label
                                        key={symptom.name}
                                        whileTap={{ scale: 0.98 }}
                                        className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg cursor-pointer transition-all duration-150 ${
                                          isChecked
                                            ? 'bg-blue-50 border border-blue-200'
                                            : 'hover:bg-slate-50 border border-transparent'
                                        }`}
                                      >
                                        <Checkbox
                                          checked={isChecked}
                                          onCheckedChange={() => handleSymptomToggle(symptom.name)}
                                        />
                                        <span className={`text-sm ${isChecked ? 'text-blue-700 font-medium' : 'text-slate-600'}`}>
                                          {symptom.name}
                                        </span>
                                      </motion.label>
                                    );
                                  })}
                                </div>
                              </div>
                            ))}
                          </motion.div>
                        ) : (
                          <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="flex flex-col items-center justify-center py-16 text-slate-400"
                          >
                            <svg className="w-16 h-16 mb-4 text-slate-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                            </svg>
                            <p className="text-sm">请在左侧点击身体部位开始选择</p>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ===== STEP 3: Lifestyle ===== */}
            {currentStep === 3 && (
              <div className="space-y-6">
                {/* Exercise */}
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
                  <div className="px-8 py-4 border-b border-slate-100">
                    <h3 className="font-semibold text-slate-800">运动情况</h3>
                  </div>
                  <div className="px-8 py-5 space-y-4">
                    <div>
                      <Label className="text-sm text-slate-700">您参加体育锻炼吗？</Label>
                      <div className="flex gap-3 mt-2">
                        {[
                          { value: 'yes', label: '是' },
                          { value: 'no', label: '否' },
                        ].map(opt => (
                          <button
                            key={opt.value}
                            type="button"
                            onClick={() => setFormData({ ...formData, exerciseParticipation: opt.value })}
                            className={`px-6 py-2 rounded-lg border text-sm font-medium transition-all ${
                              formData.exerciseParticipation === opt.value
                                ? 'border-blue-600 bg-blue-50 text-blue-700'
                                : 'border-slate-200 text-slate-500 hover:border-slate-300'
                            }`}
                          >
                            {opt.label}
                          </button>
                        ))}
                      </div>
                    </div>
                    {formData.exerciseParticipation === 'yes' && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        className="grid grid-cols-2 gap-4"
                      >
                        <div>
                          <span className="text-xs text-slate-500">锻炼类型</span>
                          <Input
                            value={formData.exerciseType}
                            onChange={(e) => setFormData({ ...formData, exerciseType: e.target.value })}
                            className="mt-1"
                          />
                        </div>
                        <div>
                          <span className="text-xs text-slate-500">每周锻炼次数</span>
                          <Input
                            value={formData.exerciseFrequency}
                            onChange={(e) => setFormData({ ...formData, exerciseFrequency: e.target.value })}
                            className="mt-1"
                          />
                        </div>
                      </motion.div>
                    )}
                  </div>
                </div>

                {/* Schedule */}
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
                  <div className="px-8 py-4 border-b border-slate-100">
                    <h3 className="font-semibold text-slate-800">作息时间</h3>
                  </div>
                  <div className="px-8 py-5">
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                      {[
                        { key: 'wakeTime', label: '起床时间' },
                        { key: 'sleepTime', label: '就寝时间' },
                        { key: 'napTime', label: '午睡时间' },
                        { key: 'hungriestTime', label: '最饿时间' },
                        { key: 'mostTiredTime', label: '最疲倦时间' },
                      ].map(item => (
                        <div key={item.key}>
                          <span className="text-xs text-slate-500">{item.label}</span>
                          <Input
                            type="time"
                            value={formData[item.key as keyof FormData] as string}
                            onChange={(e) => setFormData({ ...formData, [item.key]: e.target.value })}
                            className="mt-1"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Lifestyle Habits */}
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
                  <div className="px-8 py-4 border-b border-slate-100">
                    <h3 className="font-semibold text-slate-800">生活习惯</h3>
                  </div>
                  <div className="px-8 py-5">
                    <div className="flex flex-wrap gap-2">
                      {LIFESTYLE_HABITS.map((habit) => {
                        const isChecked = formData.lifestyleHabits.includes(habit.value);
                        return (
                          <button
                            key={habit.value}
                            type="button"
                            onClick={() => {
                              setFormData(prev => ({
                                ...prev,
                                lifestyleHabits: prev.lifestyleHabits.includes(habit.value)
                                  ? prev.lifestyleHabits.filter(h => h !== habit.value)
                                  : [...prev.lifestyleHabits, habit.value]
                              }));
                            }}
                            className={`px-4 py-2 rounded-full text-sm font-medium border transition-all ${
                              isChecked
                                ? 'bg-blue-50 border-blue-300 text-blue-700'
                                : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300'
                            }`}
                          >
                            {habit.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Meal Times */}
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
                  <div className="px-8 py-4 border-b border-slate-100">
                    <h3 className="font-semibold text-slate-800">饮食习惯</h3>
                  </div>
                  <div className="px-8 py-5 space-y-4">
                    {/* Meal schedule */}
                    <div className="space-y-3">
                      <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">三餐时间</span>
                      {[
                        { key: 'breakfast', label: '早餐' },
                        { key: 'lunch', label: '午餐' },
                        { key: 'dinner', label: '晚餐' },
                        { key: 'lateNightSnack', label: '宵夜' },
                      ].map((meal) => (
                        <div key={meal.key} className="flex items-center gap-4">
                          <span className="w-12 text-sm text-slate-600 font-medium">{meal.label}</span>
                          <div className="flex gap-2">
                            {['yes', 'no'].map(v => (
                              <button
                                key={v}
                                type="button"
                                onClick={() => setFormData({ ...formData, [`${meal.key}Has`]: v })}
                                className={`px-3 py-1.5 rounded text-xs font-medium border transition-all ${
                                  formData[`${meal.key}Has` as keyof FormData] === v
                                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                                    : 'border-slate-200 text-slate-400'
                                }`}
                              >
                                {v === 'yes' ? '有' : '无'}
                              </button>
                            ))}
                          </div>
                          <Input
                            type="time"
                            value={formData[`${meal.key}Time` as keyof FormData] as string}
                            onChange={(e) => setFormData({ ...formData, [`${meal.key}Time`]: e.target.value })}
                            className="flex-1 max-w-[160px]"
                          />
                        </div>
                      ))}
                    </div>

                    {/* Dietary Preferences */}
                    <div className="pt-4">
                      <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">饮食偏好</span>
                      <div className="flex flex-wrap gap-2 mt-3">
                        {DIETARY_PREFERENCES.map((pref) => {
                          const isChecked = formData.dietaryPreferences.includes(pref.value);
                          return (
                            <button
                              key={pref.value}
                              type="button"
                              onClick={() => {
                                setFormData(prev => ({
                                  ...prev,
                                  dietaryPreferences: prev.dietaryPreferences.includes(pref.value)
                                    ? prev.dietaryPreferences.filter(p => p !== pref.value)
                                    : [...prev.dietaryPreferences, pref.value]
                                }));
                              }}
                              className={`px-4 py-2 rounded-full text-sm font-medium border transition-all ${
                                isChecked
                                  ? 'bg-blue-50 border-blue-300 text-blue-700'
                                  : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300'
                              }`}
                            >
                              {pref.label}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Text inputs */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4">
                      <div>
                        <span className="text-xs text-slate-500">不适应的食物</span>
                        <Input
                          value={formData.unsuitableFoods}
                          onChange={(e) => setFormData({ ...formData, unsuitableFoods: e.target.value })}
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <span className="text-xs text-slate-500">吃水果的频率</span>
                        <Input
                          value={formData.fruitFrequency}
                          onChange={(e) => setFormData({ ...formData, fruitFrequency: e.target.value })}
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <span className="text-xs text-slate-500">吃粗粮的频率</span>
                        <Input
                          value={formData.coarseGrainFrequency}
                          onChange={(e) => setFormData({ ...formData, coarseGrainFrequency: e.target.value })}
                          className="mt-1"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Work Environment */}
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
                  <div className="px-8 py-4 border-b border-slate-100">
                    <h3 className="font-semibold text-slate-800">工作环境</h3>
                  </div>
                  <div className="px-8 py-5">
                    <div className="flex flex-wrap gap-2">
                      {WORK_ENVIRONMENT.map((env) => {
                        const isChecked = formData.workEnvironment.includes(env.value);
                        return (
                          <button
                            key={env.value}
                            type="button"
                            onClick={() => {
                              setFormData(prev => ({
                                ...prev,
                                workEnvironment: prev.workEnvironment.includes(env.value)
                                  ? prev.workEnvironment.filter(e => e !== env.value)
                                  : [...prev.workEnvironment, env.value]
                              }));
                            }}
                            className={`px-4 py-2 rounded-full text-sm font-medium border transition-all ${
                              isChecked
                                ? 'bg-blue-50 border-blue-300 text-blue-700'
                                : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300'
                            }`}
                          >
                            {env.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Medical History */}
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
                  <div className="px-8 py-4 border-b border-slate-100">
                    <h3 className="font-semibold text-slate-800">健康史</h3>
                  </div>
                  <div className="px-8 py-5 space-y-4">
                    <div>
                      <span className="text-xs text-slate-500">常用药物（过敏史）</span>
                      <Textarea
                        value={formData.medicationsAllergies}
                        onChange={(e) => setFormData({ ...formData, medicationsAllergies: e.target.value })}
                        rows={2}
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">既往已知患病史</span>
                      <div className="flex flex-wrap gap-2 mt-3">
                        {filteredMedicalHistory.map((disease) => {
                          const isChecked = formData.medicalHistory.includes(disease.value);
                          return (
                            <button
                              key={disease.value}
                              type="button"
                              onClick={() => {
                                setFormData(prev => ({
                                  ...prev,
                                  medicalHistory: prev.medicalHistory.includes(disease.value)
                                    ? prev.medicalHistory.filter(d => d !== disease.value)
                                    : [...prev.medicalHistory, disease.value]
                                }));
                              }}
                              className={`px-4 py-2 rounded-full text-sm font-medium border transition-all ${
                                isChecked
                                  ? 'bg-orange-50 border-orange-300 text-orange-700'
                                  : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300'
                              }`}
                            >
                              {disease.label}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Additional Notes */}
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
                  <div className="px-8 py-4 border-b border-slate-100">
                    <h3 className="font-semibold text-slate-800">诉求补充</h3>
                  </div>
                  <div className="px-8 py-5">
                    <Textarea
                      value={formData.additionalNotes}
                      onChange={(e) => setFormData({ ...formData, additionalNotes: e.target.value })}
                      rows={4}
                      className="resize-none"
                    />
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Navigation Buttons */}
        <div className="flex justify-between mt-8 pb-12">
          <Button
            onClick={handlePrevious}
            disabled={currentStep === 1}
            variant="outline"
            className="px-8 py-2.5 rounded-lg"
          >
            上一步
          </Button>
          {currentStep < 3 ? (
            <Button
              onClick={handleNext}
              className="px-8 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700"
            >
              下一步
            </Button>
          ) : (
            <Button
              onClick={handleSubmit}
              disabled={submitMutation.isPending}
              className="px-8 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-700"
            >
              {submitMutation.isPending ? "提交中..." : "提交问卷"}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
