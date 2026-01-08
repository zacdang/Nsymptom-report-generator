import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Pencil, Trash2, Plus } from "lucide-react";

export default function SymptomsManagement() {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingSymptom, setEditingSymptom] = useState<any>(null);
  const [formData, setFormData] = useState({
    name: "",
    longText: "",
    displayOrder: 0,
  });

  const utils = trpc.useUtils();
  const { data: symptoms, isLoading } = trpc.admin.symptoms.list.useQuery();

  const createMutation = trpc.admin.symptoms.create.useMutation({
    onSuccess: () => {
      toast.success("症状创建成功");
      utils.admin.symptoms.list.invalidate();
      setIsCreateOpen(false);
      setFormData({ name: "", longText: "", displayOrder: 0 });
    },
    onError: (error) => {
      toast.error(error.message || "创建症状失败");
    },
  });

  const updateMutation = trpc.admin.symptoms.update.useMutation({
    onSuccess: () => {
      toast.success("症状更新成功");
      utils.admin.symptoms.list.invalidate();
      setEditingSymptom(null);
      setFormData({ name: "", longText: "", displayOrder: 0 });
    },
    onError: (error) => {
      toast.error(error.message || "更新症状失败");
    },
  });

  const deleteMutation = trpc.admin.symptoms.delete.useMutation({
    onSuccess: () => {
      toast.success("症状删除成功");
      utils.admin.symptoms.list.invalidate();
    },
    onError: (error) => {
      toast.error(error.message || "删除症状失败");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingSymptom) {
      updateMutation.mutate({ id: editingSymptom.id, ...formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleEdit = (symptom: any) => {
    setEditingSymptom(symptom);
    setFormData({
      name: symptom.name,
      longText: symptom.longText,
      displayOrder: symptom.displayOrder,
    });
  };

  const handleDelete = (id: number) => {
    if (confirm("确定要删除这个症状吗？")) {
      deleteMutation.mutate({ id });
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>症状知识库</CardTitle>
        <Dialog open={isCreateOpen || !!editingSymptom} onOpenChange={(open) => {
          if (!open) {
            setIsCreateOpen(false);
            setEditingSymptom(null);
            setFormData({ name: "", longText: "", displayOrder: 0 });
          }
        }}>
          <DialogTrigger asChild>
            <Button onClick={() => setIsCreateOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Add Symptom
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{editingSymptom ? "编辑症状" : "添加新症状"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">症状名称</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  placeholder="e.g., 头痛"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="longText">详细描述</Label>
                <Textarea
                  id="longText"
                  value={formData.longText}
                  onChange={(e) => setFormData({ ...formData, longText: e.target.value })}
                  required
                  rows={10}
                  placeholder="输入详细描述..."
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="displayOrder">显示顺序</Label>
                <Input
                  id="displayOrder"
                  type="number"
                  value={formData.displayOrder}
                  onChange={(e) => setFormData({ ...formData, displayOrder: parseInt(e.target.value) })}
                  required
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsCreateOpen(false);
                    setEditingSymptom(null);
                    setFormData({ name: "", longText: "", displayOrder: 0 });
                  }}
                >
                  Cancel
                </Button>
                <Button type="submit">
                  {editingSymptom ? "更新" : "创建"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <p>加载症状中...</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>名称</TableHead>
                <TableHead>详细描述（预览）</TableHead>
                <TableHead>显示顺序</TableHead>
                <TableHead className="text-right">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {symptoms?.map((symptom) => (
                <TableRow key={symptom.id}>
                  <TableCell className="font-medium">{symptom.name}</TableCell>
                  <TableCell className="max-w-md truncate">{symptom.longText}</TableCell>
                  <TableCell>{symptom.displayOrder}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(symptom)}
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(symptom.id)}
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
