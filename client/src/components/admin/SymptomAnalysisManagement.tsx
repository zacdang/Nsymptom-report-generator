import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Pencil, Trash2, Plus, ChevronDown, ChevronUp, Search } from "lucide-react";

export default function SymptomAnalysisManagement() {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<any>(null);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [formData, setFormData] = useState({
    groupLabel: "",
    symptomNames: "",
    analysisText: "",
    category: "symptom",
    subCategory: "body",
    displayOrder: 0,
  });

  const utils = trpc.useUtils();
  const { data: entries, isLoading } = trpc.admin.symptomAnalysis.list.useQuery();

  const createMutation = trpc.admin.symptomAnalysis.create.useMutation({
    onSuccess: () => {
      toast.success("解析条目创建成功");
      utils.admin.symptomAnalysis.list.invalidate();
      setIsCreateOpen(false);
      resetForm();
    },
    onError: (error) => {
      toast.error(error.message || "创建失败");
    },
  });

  const updateMutation = trpc.admin.symptomAnalysis.update.useMutation({
    onSuccess: () => {
      toast.success("解析条目更新成功");
      utils.admin.symptomAnalysis.list.invalidate();
      setEditingEntry(null);
      resetForm();
    },
    onError: (error) => {
      toast.error(error.message || "更新失败");
    },
  });

  const deleteMutation = trpc.admin.symptomAnalysis.delete.useMutation({
    onSuccess: () => {
      toast.success("解析条目删除成功");
      utils.admin.symptomAnalysis.list.invalidate();
    },
    onError: (error) => {
      toast.error(error.message || "删除失败");
    },
  });

  const resetForm = () => {
    setFormData({
      groupLabel: "",
      symptomNames: "",
      analysisText: "",
      category: "symptom",
      subCategory: "body",
      displayOrder: 0,
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingEntry) {
      updateMutation.mutate({ id: editingEntry.id, ...formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleEdit = (entry: any) => {
    setEditingEntry(entry);
    setFormData({
      groupLabel: entry.groupLabel,
      symptomNames: entry.symptomNames,
      analysisText: entry.analysisText,
      category: entry.category,
      subCategory: entry.subCategory,
      displayOrder: entry.displayOrder,
    });
  };

  const handleDelete = (id: number) => {
    if (confirm("确定要删除这条解析吗？")) {
      deleteMutation.mutate({ id });
    }
  };

  const categoryLabels: Record<string, string> = {
    symptom: "身体症状",
    lifestyle: "生活习惯",
    dietary: "饮食偏好",
    dietary_text: "饮食习惯",
    work: "工作环境",
    medical: "既往病史",
  };

  const subCategoryLabels: Record<string, string> = {
    head: "头部",
    body: "身体",
    limbs: "四肢",
    mental: "精神",
    lifestyle: "生活习惯",
    dietary: "饮食偏好",
    dietary_text: "饮食习惯",
    work: "工作环境",
    medical: "既往病史",
  };

  // Filter entries
  const filteredEntries = entries?.filter((entry) => {
    const matchesSearch = searchTerm === "" || 
      entry.groupLabel.toLowerCase().includes(searchTerm.toLowerCase()) ||
      entry.analysisText.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = filterCategory === "all" || entry.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

  // Get unique categories for filter
  const categories = entries ? [...new Set(entries.map(e => e.category))] : [];

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between flex-wrap gap-4">
        <div>
          <CardTitle>体质解析知识库</CardTitle>
          <p className="text-sm text-gray-500 mt-1">
            共 {entries?.length || 0} 条解析
            {filteredEntries && filteredEntries.length !== entries?.length && 
              ` (筛选后 ${filteredEntries.length} 条)`
            }
          </p>
        </div>
        <Dialog open={isCreateOpen || !!editingEntry} onOpenChange={(open) => {
          if (!open) {
            setIsCreateOpen(false);
            setEditingEntry(null);
            resetForm();
          }
        }}>
          <DialogTrigger asChild>
            <Button onClick={() => setIsCreateOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              添加解析
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingEntry ? "编辑解析" : "添加新解析"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label>症状组名称</Label>
                <Input
                  value={formData.groupLabel}
                  onChange={(e) => setFormData({ ...formData, groupLabel: e.target.value })}
                  required
                  placeholder="e.g., 眼睛疲劳、充血、易流泪畏光、眼袋"
                />
              </div>
              <div className="space-y-2">
                <Label>症状列表 (JSON数组)</Label>
                <Textarea
                  value={formData.symptomNames}
                  onChange={(e) => setFormData({ ...formData, symptomNames: e.target.value })}
                  required
                  rows={2}
                  placeholder='["眼睛疲劳", "充血", "易流泪畏光", "眼袋"]'
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>分类</Label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
                  >
                    {Object.entries(categoryLabels).map(([value, label]) => (
                      <option key={value} value={value}>{label}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label>子分类</Label>
                  <select
                    value={formData.subCategory}
                    onChange={(e) => setFormData({ ...formData, subCategory: e.target.value })}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
                  >
                    {Object.entries(subCategoryLabels).map(([value, label]) => (
                      <option key={value} value={value}>{label}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="space-y-2">
                <Label>显示顺序</Label>
                <Input
                  type="number"
                  value={formData.displayOrder}
                  onChange={(e) => setFormData({ ...formData, displayOrder: parseInt(e.target.value) || 0 })}
                />
              </div>
              <div className="space-y-2">
                <Label>解析文本</Label>
                <Textarea
                  value={formData.analysisText}
                  onChange={(e) => setFormData({ ...formData, analysisText: e.target.value })}
                  required
                  rows={15}
                  placeholder="【症状说明】&#10;...&#10;&#10;【体质分析】&#10;...&#10;&#10;【调整方向】&#10;..."
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsCreateOpen(false);
                    setEditingEntry(null);
                    resetForm();
                  }}
                >
                  取消
                </Button>
                <Button type="submit">
                  {editingEntry ? "更新" : "创建"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        {/* Search and Filter */}
        <div className="flex gap-3 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="搜索症状名称或解析内容..."
              className="pl-10"
            />
          </div>
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm min-w-[140px]"
          >
            <option value="all">全部分类</option>
            {categories.map(cat => (
              <option key={cat} value={cat}>{categoryLabels[cat] || cat}</option>
            ))}
          </select>
        </div>

        {isLoading ? (
          <p className="text-center py-8 text-gray-500">加载中...</p>
        ) : (
          <div className="space-y-2">
            {filteredEntries?.map((entry) => (
              <div key={entry.id} className="border rounded-lg overflow-hidden">
                <div 
                  className="flex items-center justify-between px-4 py-3 bg-white hover:bg-gray-50 cursor-pointer"
                  onClick={() => setExpandedId(expandedId === entry.id ? null : entry.id)}
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 font-medium whitespace-nowrap">
                      {categoryLabels[entry.category] || entry.category}
                    </span>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 font-medium whitespace-nowrap">
                      {subCategoryLabels[entry.subCategory] || entry.subCategory}
                    </span>
                    <span className="font-medium text-sm truncate">{entry.groupLabel}</span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => { e.stopPropagation(); handleEdit(entry); }}
                    >
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => { e.stopPropagation(); handleDelete(entry.id); }}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                    {expandedId === entry.id ? (
                      <ChevronUp className="w-4 h-4 text-gray-400" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-gray-400" />
                    )}
                  </div>
                </div>
                {expandedId === entry.id && (
                  <div className="px-4 py-3 bg-gray-50 border-t">
                    <div className="text-xs text-gray-500 mb-2">
                      匹配症状：{(() => {
                        try {
                          return JSON.parse(entry.symptomNames).join('、');
                        } catch {
                          return entry.symptomNames;
                        }
                      })()}
                    </div>
                    <div className="text-sm text-gray-700 whitespace-pre-wrap max-h-96 overflow-y-auto">
                      {entry.analysisText}
                    </div>
                  </div>
                )}
              </div>
            ))}
            {filteredEntries?.length === 0 && (
              <p className="text-center py-8 text-gray-500">没有找到匹配的解析条目</p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
