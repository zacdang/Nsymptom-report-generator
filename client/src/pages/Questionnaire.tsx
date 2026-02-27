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
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { trpc } from "../lib/trpc";

type Step = 1 | 2 | 3;
type BodyPart = 'head' | 'body' | 'limbs' | 'mental' | null;

interface FormData {
  // Step 1: Basic Info
  name: string;
  gender: 'male' | 'female' | '';
  ageRange: string;
  height: string;
  weight: string;
  waist: string;
  bloodPressure: string;
  bloodSugar: string;
  bodyFat: string;

  // Step 2: Symptoms
  selectedSymptoms: string[];

  // Step 3: Lifestyle
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

export default function Questionnaire() {
  const navigate = useNavigate();
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
        toast.error("请填写必填项：姓名、性别、年龄");
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
      setTimeout(() => navigate("/"), 1500);
    },
    onError: (error) => {
      toast.error(error.message || "提交失败，请重试");
    },
  });

  const handleSubmit = async () => {
    if (!formData.name || !formData.gender || !formData.ageRange) {
      toast.error("请填写必填项：姓名、性别、年龄");
      return;
    }

    // Transform selected symptoms to include category
    const symptomsWithCategory = formData.selectedSymptoms.map(name => {
      const allSymptoms = [...HEAD_SYMPTOMS, ...BODY_SYMPTOMS, ...LIMBS_SYMPTOMS, ...MENTAL_SYMPTOMS];
      const symptom = allSymptoms.find(s => s.name === name);
      return {
        name,
        category: symptom?.category || 'body',
      };
    });

    submitMutation.mutate({
      ...formData,
      selectedSymptoms: symptomsWithCategory,
    });
  };

  const getCurrentSymptoms = (): SymptomItem[] => {
    switch (selectedBodyPart) {
      case 'head':
        return HEAD_SYMPTOMS;
      case 'body':
        return BODY_SYMPTOMS;
      case 'limbs':
        return LIMBS_SYMPTOMS;
      case 'mental':
        return MENTAL_SYMPTOMS;
      default:
        return [];
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <h1 className="text-4xl font-bold text-gray-800 mb-2">健康评估问卷</h1>
          <p className="text-gray-600">只需3分钟，了解您的健康状况</p>
        </motion.div>

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            {[1, 2, 3].map((step) => (
              <div key={step} className="flex items-center flex-1">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-colors ${
                    currentStep >= step
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-300 text-gray-600'
                  }`}
                >
                  {currentStep > step ? '✓' : step}
                </div>
                {step < 3 && (
                  <div
                    className={`flex-1 h-1 mx-2 transition-colors ${
                      currentStep > step ? 'bg-blue-500' : 'bg-gray-300'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
          <div className="flex justify-between text-sm text-gray-600">
            <span>基本信息</span>
            <span>症状选择</span>
            <span>生活习惯</span>
          </div>
        </div>

        {/* Content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            {currentStep === 1 && (
              <Card>
                <CardHeader>
                  <CardTitle>基本信息</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="name">姓名 *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="请输入您的姓名"
                    />
                  </div>

                  <div>
                    <Label>性别 *</Label>
                    <div className="flex gap-4 mt-2">
                      <label className="flex items-center">
                        <input
                          type="radio"
                          name="gender"
                          value="male"
                          checked={formData.gender === 'male'}
                          onChange={(e) => setFormData({ ...formData, gender: e.target.value as 'male' })}
                          className="mr-2"
                        />
                        男
                      </label>
                      <label className="flex items-center">
                        <input
                          type="radio"
                          name="gender"
                          value="female"
                          checked={formData.gender === 'female'}
                          onChange={(e) => setFormData({ ...formData, gender: e.target.value as 'female' })}
                          className="mr-2"
                        />
                        女
                      </label>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="ageRange">年龄范围 *</Label>
                    <select
                      id="ageRange"
                      value={formData.ageRange}
                      onChange={(e) => setFormData({ ...formData, ageRange: e.target.value })}
                      className="w-full border rounded-md p-2"
                    >
                      <option value="">请选择</option>
                      {AGE_RANGES.map(range => (
                        <option key={range} value={range}>{range}</option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="height">身高 (cm)</Label>
                      <Input
                        id="height"
                        type="number"
                        value={formData.height}
                        onChange={(e) => setFormData({ ...formData, height: e.target.value })}
                        placeholder="170"
                      />
                    </div>
                    <div>
                      <Label htmlFor="weight">体重 (kg)</Label>
                      <Input
                        id="weight"
                        type="number"
                        value={formData.weight}
                        onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
                        placeholder="65"
                      />
                    </div>
                    <div>
                      <Label htmlFor="waist">腰围 (cm)</Label>
                      <Input
                        id="waist"
                        type="number"
                        value={formData.waist}
                        onChange={(e) => setFormData({ ...formData, waist: e.target.value })}
                        placeholder="80"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="bloodPressure">血压 (mmHg)</Label>
                      <Input
                        id="bloodPressure"
                        value={formData.bloodPressure}
                        onChange={(e) => setFormData({ ...formData, bloodPressure: e.target.value })}
                        placeholder="120/80"
                      />
                    </div>
                    <div>
                      <Label htmlFor="bloodSugar">血糖 (mmol/l)</Label>
                      <Input
                        id="bloodSugar"
                        value={formData.bloodSugar}
                        onChange={(e) => setFormData({ ...formData, bloodSugar: e.target.value })}
                        placeholder="5.5"
                      />
                    </div>
                    <div>
                      <Label htmlFor="bodyFat">体脂率 (%)</Label>
                      <Input
                        id="bodyFat"
                        value={formData.bodyFat}
                        onChange={(e) => setFormData({ ...formData, bodyFat: e.target.value })}
                        placeholder="20"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {currentStep === 2 && (
              <div className="grid md:grid-cols-2 gap-6">
                <Card className="md:sticky md:top-4 h-fit">
                  <CardHeader>
                    <CardTitle>选择身体部位</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <HumanBodyDiagram
                      selectedPart={selectedBodyPart}
                      onPartClick={setSelectedBodyPart}
                    />
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>
                      {selectedBodyPart === 'head' && '头部症状'}
                      {selectedBodyPart === 'body' && '身体症状'}
                      {selectedBodyPart === 'limbs' && '四肢症状'}
                      {selectedBodyPart === 'mental' && '精神状态'}
                      {!selectedBodyPart && '请选择身体部位'}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {selectedBodyPart ? (
                      <div className="space-y-4">
                        {Object.entries(groupSymptomsBySubcategory(getCurrentSymptoms())).map(([subcategory, symptoms]) => (
                          <div key={subcategory}>
                            {subcategory !== '其他' && symptoms.length > 0 && (
                              <h4 className="font-semibold text-gray-700 mb-2">{subcategory}</h4>
                            )}
                            <div className="grid grid-cols-2 gap-2">
                              {symptoms.map((symptom) => (
                                <label
                                  key={symptom.name}
                                  className="flex items-center space-x-2 p-2 rounded hover:bg-gray-50 cursor-pointer"
                                >
                                  <Checkbox
                                    checked={formData.selectedSymptoms.includes(symptom.name)}
                                    onCheckedChange={() => handleSymptomToggle(symptom.name)}
                                  />
                                  <span className="text-sm">{symptom.name}</span>
                                </label>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-gray-500 text-center py-8">
                        👈 请点击左侧人体图选择部位
                      </p>
                    )}
                  </CardContent>
                </Card>
              </div>
            )}

            {currentStep === 3 && (
              <Card>
                <CardHeader>
                  <CardTitle>生活习惯</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Exercise */}
                  <div>
                    <Label>您参加体育锻炼吗？</Label>
                    <div className="flex gap-4 mt-2">
                      <label className="flex items-center">
                        <input
                          type="radio"
                          name="exercise"
                          value="yes"
                          checked={formData.exerciseParticipation === 'yes'}
                          onChange={(e) => setFormData({ ...formData, exerciseParticipation: e.target.value })}
                          className="mr-2"
                        />
                        是
                      </label>
                      <label className="flex items-center">
                        <input
                          type="radio"
                          name="exercise"
                          value="no"
                          checked={formData.exerciseParticipation === 'no'}
                          onChange={(e) => setFormData({ ...formData, exerciseParticipation: e.target.value })}
                          className="mr-2"
                        />
                        否
                      </label>
                    </div>
                  </div>

                  {formData.exerciseParticipation === 'yes' && (
                    <>
                      <div>
                        <Label htmlFor="exerciseType">锻炼类型</Label>
                        <Input
                          id="exerciseType"
                          value={formData.exerciseType}
                          onChange={(e) => setFormData({ ...formData, exerciseType: e.target.value })}
                          placeholder="例：跑步、游泳、瑜伽"
                        />
                      </div>
                      <div>
                        <Label htmlFor="exerciseFrequency">每周锻炼次数</Label>
                        <Input
                          id="exerciseFrequency"
                          value={formData.exerciseFrequency}
                          onChange={(e) => setFormData({ ...formData, exerciseFrequency: e.target.value })}
                          placeholder="例：3次"
                        />
                      </div>
                    </>
                  )}

                  {/* Sleep Schedule */}
                  <div>
                    <h4 className="font-semibold mb-2">作息时间</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="wakeTime">起床时间</Label>
                        <Input
                          id="wakeTime"
                          type="time"
                          value={formData.wakeTime}
                          onChange={(e) => setFormData({ ...formData, wakeTime: e.target.value })}
                        />
                      </div>
                      <div>
                        <Label htmlFor="sleepTime">就寝时间</Label>
                        <Input
                          id="sleepTime"
                          type="time"
                          value={formData.sleepTime}
                          onChange={(e) => setFormData({ ...formData, sleepTime: e.target.value })}
                        />
                      </div>
                      <div>
                        <Label htmlFor="napTime">午睡时间</Label>
                        <Input
                          id="napTime"
                          type="time"
                          value={formData.napTime}
                          onChange={(e) => setFormData({ ...formData, napTime: e.target.value })}
                        />
                      </div>
                      <div>
                        <Label htmlFor="hungriestTime">最饿时间</Label>
                        <Input
                          id="hungriestTime"
                          type="time"
                          value={formData.hungriestTime}
                          onChange={(e) => setFormData({ ...formData, hungriestTime: e.target.value })}
                        />
                      </div>
                      <div>
                        <Label htmlFor="mostTiredTime">最疲倦时间</Label>
                        <Input
                          id="mostTiredTime"
                          type="time"
                          value={formData.mostTiredTime}
                          onChange={(e) => setFormData({ ...formData, mostTiredTime: e.target.value })}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Lifestyle Habits */}
                  <div>
                    <Label>生活习惯</Label>
                    <div className="grid grid-cols-3 gap-2 mt-2">
                      {LIFESTYLE_HABITS.map((habit) => (
                        <label key={habit.value} className="flex items-center space-x-2">
                          <Checkbox
                            checked={formData.lifestyleHabits.includes(habit.value)}
                            onCheckedChange={() => {
                              setFormData(prev => ({
                                ...prev,
                                lifestyleHabits: prev.lifestyleHabits.includes(habit.value)
                                  ? prev.lifestyleHabits.filter(h => h !== habit.value)
                                  : [...prev.lifestyleHabits, habit.value]
                              }));
                            }}
                          />
                          <span className="text-sm">{habit.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Meal Times */}
                  <div>
                    <h4 className="font-semibold mb-2">饮食习惯</h4>
                    <div className="space-y-2">
                      {[
                        { key: 'breakfast', label: '早餐' },
                        { key: 'lunch', label: '午餐' },
                        { key: 'dinner', label: '晚餐' },
                        { key: 'lateNightSnack', label: '宵夜' },
                      ].map((meal) => (
                        <div key={meal.key} className="flex items-center gap-4">
                          <span className="w-16">{meal.label}</span>
                          <select
                            value={formData[`${meal.key}Has` as keyof FormData] as string}
                            onChange={(e) => setFormData({ ...formData, [`${meal.key}Has`]: e.target.value })}
                            className="border rounded p-1"
                          >
                            <option value="">选择</option>
                            <option value="yes">有</option>
                            <option value="no">无</option>
                          </select>
                          <Input
                            type="time"
                            value={formData[`${meal.key}Time` as keyof FormData] as string}
                            onChange={(e) => setFormData({ ...formData, [`${meal.key}Time`]: e.target.value })}
                            className="flex-1"
                          />
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Dietary Preferences */}
                  <div>
                    <Label>饮食偏好</Label>
                    <div className="grid grid-cols-3 gap-2 mt-2">
                      {DIETARY_PREFERENCES.map((pref) => (
                        <label key={pref.value} className="flex items-center space-x-2">
                          <Checkbox
                            checked={formData.dietaryPreferences.includes(pref.value)}
                            onCheckedChange={() => {
                              setFormData(prev => ({
                                ...prev,
                                dietaryPreferences: prev.dietaryPreferences.includes(pref.value)
                                  ? prev.dietaryPreferences.filter(p => p !== pref.value)
                                  : [...prev.dietaryPreferences, pref.value]
                              }));
                            }}
                          />
                          <span className="text-sm">{pref.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="unsuitableFoods">不适应的食物</Label>
                    <Input
                      id="unsuitableFoods"
                      value={formData.unsuitableFoods}
                      onChange={(e) => setFormData({ ...formData, unsuitableFoods: e.target.value })}
                      placeholder="例：海鲜、牛奶"
                    />
                  </div>

                  <div>
                    <Label htmlFor="fruitFrequency">吃水果的频率</Label>
                    <Input
                      id="fruitFrequency"
                      value={formData.fruitFrequency}
                      onChange={(e) => setFormData({ ...formData, fruitFrequency: e.target.value })}
                      placeholder="例：一天一个苹果"
                    />
                  </div>

                  <div>
                    <Label htmlFor="coarseGrainFrequency">吃粗粮的频率</Label>
                    <Input
                      id="coarseGrainFrequency"
                      value={formData.coarseGrainFrequency}
                      onChange={(e) => setFormData({ ...formData, coarseGrainFrequency: e.target.value })}
                      placeholder="例：每周3次"
                    />
                  </div>

                  {/* Work Environment */}
                  <div>
                    <Label>工作环境</Label>
                    <div className="grid grid-cols-3 gap-2 mt-2">
                      {WORK_ENVIRONMENT.map((env) => (
                        <label key={env.value} className="flex items-center space-x-2">
                          <Checkbox
                            checked={formData.workEnvironment.includes(env.value)}
                            onCheckedChange={() => {
                              setFormData(prev => ({
                                ...prev,
                                workEnvironment: prev.workEnvironment.includes(env.value)
                                  ? prev.workEnvironment.filter(e => e !== env.value)
                                  : [...prev.workEnvironment, env.value]
                              }));
                            }}
                          />
                          <span className="text-sm">{env.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Medical History */}
                  <div>
                    <Label htmlFor="medicationsAllergies">常用药物（过敏史）</Label>
                    <Textarea
                      id="medicationsAllergies"
                      value={formData.medicationsAllergies}
                      onChange={(e) => setFormData({ ...formData, medicationsAllergies: e.target.value })}
                      placeholder="请列出您常用的药物或过敏史"
                      rows={3}
                    />
                  </div>

                  <div>
                    <Label>既往已知患病史</Label>
                    <div className="grid grid-cols-3 gap-2 mt-2 max-h-60 overflow-y-auto">
                      {MEDICAL_HISTORY.map((disease) => (
                        <label key={disease.value} className="flex items-center space-x-2">
                          <Checkbox
                            checked={formData.medicalHistory.includes(disease.value)}
                            onCheckedChange={() => {
                              setFormData(prev => ({
                                ...prev,
                                medicalHistory: prev.medicalHistory.includes(disease.value)
                                  ? prev.medicalHistory.filter(d => d !== disease.value)
                                  : [...prev.medicalHistory, disease.value]
                              }));
                            }}
                          />
                          <span className="text-sm">{disease.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Additional Notes */}
                  <div>
                    <Label htmlFor="additionalNotes">诉求补充</Label>
                    <Textarea
                      id="additionalNotes"
                      value={formData.additionalNotes}
                      onChange={(e) => setFormData({ ...formData, additionalNotes: e.target.value })}
                      placeholder="请详细描述您的健康诉求或其他需要补充的信息"
                      rows={5}
                    />
                  </div>
                </CardContent>
              </Card>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Navigation Buttons */}
        <div className="flex justify-between mt-8">
          <Button
            onClick={handlePrevious}
            disabled={currentStep === 1}
            variant="outline"
          >
            上一步
          </Button>
          {currentStep < 3 ? (
            <Button onClick={handleNext}>
              下一步
            </Button>
          ) : (
            <Button onClick={handleSubmit}>
              提交问卷
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
