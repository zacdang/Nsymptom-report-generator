import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { trpc } from "@/lib/trpc";
import { format } from "date-fns";
import { zhCN } from "date-fns/locale";
import { ChevronDown, ChevronUp, Eye, FileText } from "lucide-react";

export default function ReportsView() {
  const { data: questionnaires, isLoading } = trpc.questionnaire.myCustomers.useQuery();
  const { data: employees } = trpc.admin.employees.list.useQuery();
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [sortOrder, setSortOrder] = useState<"desc" | "asc">("desc");

  // Fetch detail for selected questionnaire
  const { data: detail, isLoading: isLoadingDetail } = trpc.questionnaire.get.useQuery(
    { id: selectedId! },
    { enabled: selectedId !== null }
  );

  const employeeMap = new Map<number, string>();
  if (employees) {
    for (const emp of employees) {
      employeeMap.set(emp.id, emp.name);
    }
  }

  const sortedData = questionnaires
    ? [...questionnaires].sort((a, b) => {
        const dateA = new Date(a.createdAt).getTime();
        const dateB = new Date(b.createdAt).getTime();
        return sortOrder === "desc" ? dateB - dateA : dateA - dateB;
      })
    : [];

  const totalCount = sortedData.length;

  const formatDate = (date: string | Date) => {
    try {
      return format(new Date(date), "yyyy-MM-dd HH:mm:ss", { locale: zhCN });
    } catch {
      return "-";
    }
  };

  const genderLabel = (g: string) => (g === "male" ? "男" : "女");

  return (
    <div className="space-y-4">
      {/* Summary Card */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <FileText className="w-6 h-6 text-green-600" />
              <div>
                <p className="text-sm text-gray-500">问卷报告总数</p>
                <p className="text-3xl font-bold text-green-700">{isLoading ? "..." : totalCount}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Reports Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>所有问卷报告</span>
            {totalCount > 0 && (
              <Badge variant="secondary">{totalCount} 条记录</Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-center py-8 text-gray-500">加载报告中...</p>
          ) : totalCount === 0 ? (
            <p className="text-center py-8 text-gray-500">暂无问卷报告</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-16">序号</TableHead>
                    <TableHead>姓名</TableHead>
                    <TableHead>性别</TableHead>
                    <TableHead>年龄范围</TableHead>
                    <TableHead>负责伙伴</TableHead>
                    <TableHead
                      className="cursor-pointer select-none"
                      onClick={() => setSortOrder(sortOrder === "desc" ? "asc" : "desc")}
                    >
                      <span className="flex items-center gap-1">
                        创建时间
                        {sortOrder === "desc" ? (
                          <ChevronDown className="w-4 h-4" />
                        ) : (
                          <ChevronUp className="w-4 h-4" />
                        )}
                      </span>
                    </TableHead>
                    <TableHead className="w-20">操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedData.map((item, index) => (
                    <TableRow key={item.id} className="hover:bg-gray-50">
                      <TableCell className="text-gray-500">{index + 1}</TableCell>
                      <TableCell className="font-medium">{item.name}</TableCell>
                      <TableCell>
                        <Badge variant={item.gender === "male" ? "default" : "secondary"}>
                          {genderLabel(item.gender)}
                        </Badge>
                      </TableCell>
                      <TableCell>{item.ageRange}</TableCell>
                      <TableCell>
                        {item.employeeId ? (employeeMap.get(item.employeeId) || `ID: ${item.employeeId}`) : "-"}
                      </TableCell>
                      <TableCell className="text-sm text-gray-600">
                        {formatDate(item.createdAt)}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSelectedId(item.id)}
                        >
                          <Eye className="w-4 h-4 mr-1" />
                          详情
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Detail Dialog */}
      <Dialog open={selectedId !== null} onOpenChange={(open) => { if (!open) setSelectedId(null); }}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>问卷详情</DialogTitle>
          </DialogHeader>
          {isLoadingDetail ? (
            <p className="text-center py-4">加载中...</p>
          ) : detail ? (
            <div className="space-y-6">
              {/* Basic Info */}
              <div>
                <h3 className="font-semibold text-lg mb-3 border-b pb-2">基本信息</h3>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div><span className="text-gray-500">姓名：</span><span className="font-medium">{detail.name}</span></div>
                  <div><span className="text-gray-500">性别：</span><span className="font-medium">{genderLabel(detail.gender)}</span></div>
                  <div><span className="text-gray-500">年龄范围：</span><span className="font-medium">{detail.ageRange}</span></div>
                  {detail.height && <div><span className="text-gray-500">身高：</span><span className="font-medium">{detail.height} cm</span></div>}
                  {detail.weight && <div><span className="text-gray-500">体重：</span><span className="font-medium">{detail.weight} kg</span></div>}
                  {detail.waist && <div><span className="text-gray-500">腰围：</span><span className="font-medium">{detail.waist} cm</span></div>}
                  {detail.bloodPressure && <div><span className="text-gray-500">血压：</span><span className="font-medium">{detail.bloodPressure}</span></div>}
                  {detail.bloodSugar && <div><span className="text-gray-500">血糖：</span><span className="font-medium">{detail.bloodSugar}</span></div>}
                  {detail.bodyFat && <div><span className="text-gray-500">体脂率：</span><span className="font-medium">{detail.bodyFat}%</span></div>}
                  <div><span className="text-gray-500">负责伙伴：</span><span className="font-medium">{detail.employeeId ? (employeeMap.get(detail.employeeId) || `ID: ${detail.employeeId}`) : "-"}</span></div>
                  <div><span className="text-gray-500">创建时间：</span><span className="font-medium">{formatDate(detail.createdAt)}</span></div>
                  <div><span className="text-gray-500">更新时间：</span><span className="font-medium">{formatDate(detail.updatedAt)}</span></div>
                </div>
              </div>

              {/* Symptoms */}
              {detail.symptoms && detail.symptoms.length > 0 && (
                <div>
                  <h3 className="font-semibold text-lg mb-3 border-b pb-2">选择的症状</h3>
                  <div className="flex flex-wrap gap-2">
                    {detail.symptoms.map((s: any, i: number) => (
                      <Badge key={i} variant="outline" className="text-sm">
                        {s.symptomName}
                        <span className="ml-1 text-xs text-gray-400">
                          ({s.category === "head" ? "头部" : s.category === "body" ? "身体" : s.category === "limbs" ? "四肢" : "精神"})
                        </span>
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Lifestyle */}
              {detail.lifestyle && (
                <div>
                  <h3 className="font-semibold text-lg mb-3 border-b pb-2">生活习惯</h3>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    {detail.lifestyle.exerciseParticipation && (
                      <div><span className="text-gray-500">运动参与：</span><span className="font-medium">{detail.lifestyle.exerciseParticipation}</span></div>
                    )}
                    {detail.lifestyle.exerciseType && (
                      <div><span className="text-gray-500">运动类型：</span><span className="font-medium">{detail.lifestyle.exerciseType}</span></div>
                    )}
                    {detail.lifestyle.exerciseFrequency && (
                      <div><span className="text-gray-500">运动频率：</span><span className="font-medium">{detail.lifestyle.exerciseFrequency}</span></div>
                    )}
                    {detail.lifestyle.wakeTime && (
                      <div><span className="text-gray-500">起床时间：</span><span className="font-medium">{detail.lifestyle.wakeTime}</span></div>
                    )}
                    {detail.lifestyle.napTime && (
                      <div><span className="text-gray-500">午休时间：</span><span className="font-medium">{detail.lifestyle.napTime}</span></div>
                    )}
                    {detail.lifestyle.sleepTime && (
                      <div><span className="text-gray-500">入睡时间：</span><span className="font-medium">{detail.lifestyle.sleepTime}</span></div>
                    )}
                    {detail.lifestyle.hungriestTime && (
                      <div><span className="text-gray-500">最饿时间：</span><span className="font-medium">{detail.lifestyle.hungriestTime}</span></div>
                    )}
                    {detail.lifestyle.mostTiredTime && (
                      <div><span className="text-gray-500">最累时间：</span><span className="font-medium">{detail.lifestyle.mostTiredTime}</span></div>
                    )}
                    {detail.lifestyle.breakfastTime && (
                      <div><span className="text-gray-500">早餐时间：</span><span className="font-medium">{detail.lifestyle.breakfastTime}</span></div>
                    )}
                    {detail.lifestyle.breakfastHas && (
                      <div><span className="text-gray-500">早餐有无：</span><span className="font-medium">{detail.lifestyle.breakfastHas}</span></div>
                    )}
                    {detail.lifestyle.lunchTime && (
                      <div><span className="text-gray-500">午餐时间：</span><span className="font-medium">{detail.lifestyle.lunchTime}</span></div>
                    )}
                    {detail.lifestyle.lunchHas && (
                      <div><span className="text-gray-500">午餐有无：</span><span className="font-medium">{detail.lifestyle.lunchHas}</span></div>
                    )}
                    {detail.lifestyle.dinnerTime && (
                      <div><span className="text-gray-500">晚餐时间：</span><span className="font-medium">{detail.lifestyle.dinnerTime}</span></div>
                    )}
                    {detail.lifestyle.dinnerHas && (
                      <div><span className="text-gray-500">晚餐有无：</span><span className="font-medium">{detail.lifestyle.dinnerHas}</span></div>
                    )}
                    {detail.lifestyle.lateNightSnackTime && (
                      <div><span className="text-gray-500">宵夜时间：</span><span className="font-medium">{detail.lifestyle.lateNightSnackTime}</span></div>
                    )}
                    {detail.lifestyle.lateNightSnackHas && (
                      <div><span className="text-gray-500">宵夜有无：</span><span className="font-medium">{detail.lifestyle.lateNightSnackHas}</span></div>
                    )}
                    {detail.lifestyle.unsuitableFoods && (
                      <div className="col-span-2"><span className="text-gray-500">不适应食物：</span><span className="font-medium">{detail.lifestyle.unsuitableFoods}</span></div>
                    )}
                    {detail.lifestyle.fruitFrequency && (
                      <div><span className="text-gray-500">水果频率：</span><span className="font-medium">{detail.lifestyle.fruitFrequency}</span></div>
                    )}
                    {detail.lifestyle.coarseGrainFrequency && (
                      <div><span className="text-gray-500">粗粮频率：</span><span className="font-medium">{detail.lifestyle.coarseGrainFrequency}</span></div>
                    )}
                    {detail.lifestyle.medicationsAllergies && (
                      <div className="col-span-2"><span className="text-gray-500">药物过敏：</span><span className="font-medium">{detail.lifestyle.medicationsAllergies}</span></div>
                    )}
                  </div>

                  {/* JSON array fields */}
                  {detail.lifestyle.lifestyleHabits && (
                    <div className="mt-3">
                      <span className="text-sm text-gray-500">生活习惯：</span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {JSON.parse(detail.lifestyle.lifestyleHabits).map((h: string, i: number) => (
                          <Badge key={i} variant="outline" className="text-xs">{h}</Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  {detail.lifestyle.dietaryPreferences && (
                    <div className="mt-3">
                      <span className="text-sm text-gray-500">饮食偏好：</span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {JSON.parse(detail.lifestyle.dietaryPreferences).map((d: string, i: number) => (
                          <Badge key={i} variant="outline" className="text-xs">{d}</Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  {detail.lifestyle.workEnvironment && (
                    <div className="mt-3">
                      <span className="text-sm text-gray-500">工作环境：</span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {JSON.parse(detail.lifestyle.workEnvironment).map((w: string, i: number) => (
                          <Badge key={i} variant="outline" className="text-xs">{w}</Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  {detail.lifestyle.medicalHistory && (
                    <div className="mt-3">
                      <span className="text-sm text-gray-500">既往病史：</span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {JSON.parse(detail.lifestyle.medicalHistory).map((m: string, i: number) => (
                          <Badge key={i} variant="outline" className="text-xs">{m}</Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Additional Notes */}
              {detail.additionalNotes && (
                <div>
                  <h3 className="font-semibold text-lg mb-3 border-b pb-2">补充说明</h3>
                  <p className="text-sm text-gray-700 whitespace-pre-wrap">{detail.additionalNotes}</p>
                </div>
              )}
            </div>
          ) : (
            <p className="text-center py-4 text-gray-500">未找到详情</p>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
