import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Trash2, Plus, Key, ChevronDown, ChevronRight, Eye, Users } from "lucide-react";
import { format } from "date-fns";
import { zhCN } from "date-fns/locale";

function EmployeeCustomers({ employeeId }: { employeeId: number }) {
  const { data: customers, isLoading } = trpc.questionnaire.byEmployeeId.useQuery({ employeeId });
  const [selectedId, setSelectedId] = useState<number | null>(null);

  const { data: detail, isLoading: isLoadingDetail } = trpc.questionnaire.get.useQuery(
    { id: selectedId! },
    { enabled: selectedId !== null }
  );

  const formatDate = (date: string | Date) => {
    try {
      return format(new Date(date), "yyyy-MM-dd HH:mm", { locale: zhCN });
    } catch {
      return "-";
    }
  };

  const genderLabel = (g: string) => (g === "male" ? "男" : "女");

  if (isLoading) return <div className="py-2 px-4 text-sm text-gray-500">加载客户中...</div>;
  if (!customers || customers.length === 0) return <div className="py-2 px-4 text-sm text-gray-400">暂无客户</div>;

  return (
    <>
      <div className="bg-gray-50 px-4 py-2">
        <div className="text-xs text-gray-500 mb-2 flex items-center gap-1">
          <Users className="w-3 h-3" />
          共 {customers.length} 位客户
        </div>
        <Table>
          <TableHeader>
            <TableRow className="text-xs">
              <TableHead className="py-1">客户姓名</TableHead>
              <TableHead className="py-1">性别</TableHead>
              <TableHead className="py-1">年龄范围</TableHead>
              <TableHead className="py-1">提交时间</TableHead>
              <TableHead className="py-1 text-right">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {customers.map((c) => (
              <TableRow key={c.id} className="text-sm">
                <TableCell className="py-1 font-medium">{c.name}</TableCell>
                <TableCell className="py-1">
                  <Badge variant={c.gender === "male" ? "default" : "secondary"} className="text-xs">
                    {genderLabel(c.gender)}
                  </Badge>
                </TableCell>
                <TableCell className="py-1">{c.ageRange}</TableCell>
                <TableCell className="py-1 text-gray-600">{formatDate(c.createdAt)}</TableCell>
                <TableCell className="py-1 text-right">
                  <Button variant="ghost" size="sm" onClick={() => setSelectedId(c.id)}>
                    <Eye className="w-3 h-3 mr-1" />
                    详情
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Detail Dialog */}
      <Dialog open={selectedId !== null} onOpenChange={(open) => { if (!open) setSelectedId(null); }}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>客户问卷详情</DialogTitle>
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
    </>
  );
}

export default function EmployeesManagement() {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [resetPasswordEmployee, setResetPasswordEmployee] = useState<any>(null);
  const [expandedEmployee, setExpandedEmployee] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    password: "",
    name: "",
    role: "employee" as "admin" | "employee",
  });
  const [newPassword, setNewPassword] = useState("");

  const utils = trpc.useUtils();
  const { data: employees, isLoading } = trpc.admin.employees.list.useQuery();

  const createMutation = trpc.admin.employees.create.useMutation({
    onSuccess: () => {
      toast.success("伙伴创建成功");
      utils.admin.employees.list.invalidate();
      setIsCreateOpen(false);
      setFormData({ password: "", name: "", role: "employee" });
    },
    onError: (error) => {
      toast.error(error.message || "创建伙伴失败");
    },
  });

  const resetPasswordMutation = trpc.admin.employees.resetPassword.useMutation({
    onSuccess: () => {
      toast.success("密码重置成功");
      setResetPasswordEmployee(null);
      setNewPassword("");
    },
    onError: (error) => {
      toast.error(error.message || "重置密码失败");
    },
  });

  const deleteMutation = trpc.admin.employees.delete.useMutation({
    onSuccess: () => {
      toast.success("伙伴删除成功");
      utils.admin.employees.list.invalidate();
    },
    onError: (error) => {
      toast.error(error.message || "删除伙伴失败");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate(formData);
  };

  const handleResetPassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (resetPasswordEmployee) {
      resetPasswordMutation.mutate({
        id: resetPasswordEmployee.id,
        newPassword,
      });
    }
  };

  const handleDelete = (id: number) => {
    if (confirm("确定要删除这个伙伴吗？")) {
      deleteMutation.mutate({ id });
    }
  };

  const toggleExpand = (id: number) => {
    setExpandedEmployee(expandedEmployee === id ? null : id);
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>伙伴管理</CardTitle>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              添加伙伴
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>添加新伙伴</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">姓名</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">密码</Label>
                <Input
                  id="password"
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="role">角色</Label>
                <Select
                  value={formData.role}
                  onValueChange={(value: "admin" | "employee") => setFormData({ ...formData, role: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="employee">伙伴</SelectItem>
                    <SelectItem value="admin">管理员</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>
                  取消
                </Button>
                <Button type="submit">创建</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        <Dialog open={!!resetPasswordEmployee} onOpenChange={(open) => {
          if (!open) {
            setResetPasswordEmployee(null);
            setNewPassword("");
          }
        }}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>重置 {resetPasswordEmployee?.name} 的密码</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleResetPassword} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="newPassword">新密码</Label>
                <Input
                  id="newPassword"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setResetPasswordEmployee(null);
                    setNewPassword("");
                  }}
                >
                  取消
                </Button>
                <Button type="submit">重置密码</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <p>加载伙伴中...</p>
        ) : (
          <div className="space-y-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10"></TableHead>
                  <TableHead>姓名</TableHead>
                  <TableHead>角色</TableHead>
                  <TableHead className="text-right">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {employees?.map((employee) => (
                  <>
                    <TableRow
                      key={employee.id}
                      className={`cursor-pointer hover:bg-gray-50 ${expandedEmployee === employee.id ? "bg-gray-50" : ""}`}
                      onClick={() => toggleExpand(employee.id)}
                    >
                      <TableCell className="w-10">
                        {expandedEmployee === employee.id ? (
                          <ChevronDown className="w-4 h-4 text-gray-500" />
                        ) : (
                          <ChevronRight className="w-4 h-4 text-gray-500" />
                        )}
                      </TableCell>
                      <TableCell className="font-medium">{employee.name}</TableCell>
                      <TableCell>
                        <Badge variant={employee.role === "admin" ? "default" : "secondary"}>
                          {employee.role === "admin" ? "管理员" : "伙伴"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setResetPasswordEmployee(employee)}
                          >
                            <Key className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(employee.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                    {expandedEmployee === employee.id && (
                      <TableRow key={`${employee.id}-customers`}>
                        <TableCell colSpan={4} className="p-0">
                          <EmployeeCustomers employeeId={employee.id} />
                        </TableCell>
                      </TableRow>
                    )}
                  </>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
