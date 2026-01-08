import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Trash2, Plus, Key } from "lucide-react";

export default function EmployeesManagement() {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [resetPasswordEmployee, setResetPasswordEmployee] = useState<any>(null);
  const [formData, setFormData] = useState({
    username: "",
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
      setFormData({ username: "", password: "", name: "", role: "employee" });
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
                <Label htmlFor="username">用户名</Label>
                <Input
                  id="username"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
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
                <Label htmlFor="name">姓名</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
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
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>用户名</TableHead>
                <TableHead>姓名</TableHead>
                <TableHead>角色</TableHead>
                <TableHead className="text-right">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {employees?.map((employee) => (
                <TableRow key={employee.id}>
                  <TableCell className="font-medium">{employee.username}</TableCell>
                  <TableCell>{employee.name}</TableCell>
                  <TableCell className="capitalize">{employee.role}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
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
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
