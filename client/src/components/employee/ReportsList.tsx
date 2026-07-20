import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { format } from "date-fns";
import { Download, Edit, Save, X, Loader2, FileText } from "lucide-react";
import { generateReportPDF } from "@/lib/pdfGenerator";

interface ReportsListProps {
  employeeId: number;
}

export default function ReportsList({ employeeId }: ReportsListProps) {
  const { data: reports, isLoading } = trpc.reports.list.useQuery({ employeeId });
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editContent, setEditContent] = useState("");
  const [downloadingId, setDownloadingId] = useState<number | null>(null);

  const utils = trpc.useUtils();

  const updateReportMutation = trpc.reports.update.useMutation({
    onSuccess: () => {
      toast.success("报告已更新");
      setEditingId(null);
      utils.reports.list.invalidate();
    },
    onError: (error) => {
      toast.error(error.message || "更新失败");
    },
  });

  const handleEdit = (reportId: number, content: string) => {
    setEditingId(reportId);
    setEditContent(content || "");
  };

  const handleSaveEdit = (reportId: number) => {
    updateReportMutation.mutate({
      id: reportId,
      generatedText: editContent,
    });
  };

  const handleDownloadPDF = async (report: any) => {
    if (!report.generatedText) {
      toast.error("该报告没有内容，无法生成 PDF");
      return;
    }
    setDownloadingId(report.id);
    try {
      // Extract customer name from symptoms field (format: "[问卷生成] 客户名")
      let customerName = "客户";
      if (report.symptoms) {
        const match = report.symptoms.match(/\[问卷生成\]\s*(.+)/);
        if (match) {
          customerName = match[1];
        } else {
          customerName = report.symptoms;
        }
      }
      await generateReportPDF(report.generatedText, customerName);
      toast.success("PDF 下载成功");
    } catch (error) {
      console.error("PDF generation error:", error);
      toast.error("生成 PDF 失败，请重试");
    } finally {
      setDownloadingId(null);
    }
  };

  // Extract customer name for display
  const getCustomerName = (symptoms: string) => {
    if (!symptoms) return "未知客户";
    const match = symptoms.match(/\[问卷生成\]\s*(.+)/);
    if (match) return match[1];
    return symptoms;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="w-5 h-5" />
          我的报告
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <p className="text-center text-gray-500 py-4">加载报告中...</p>
        ) : reports && reports.length > 0 ? (
          <div className="space-y-4">
            {reports.map((report: any) => (
              <div key={report.id} className="border rounded-lg p-4 hover:bg-gray-50">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-lg">{getCustomerName(report.symptoms)}</p>
                    <p className="text-sm text-gray-500">
                      创建于 {report.createdAt ? format(new Date(report.createdAt), "yyyy/MM/dd HH:mm") : '-'}
                      {report.updatedAt && report.updatedAt !== report.createdAt && (
                        <span> · 更新于 {format(new Date(report.updatedAt), "yyyy/MM/dd HH:mm")}</span>
                      )}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleEdit(report.id, report.generatedText)}
                    >
                      <Edit className="w-4 h-4 mr-1" />
                      编辑
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => handleDownloadPDF(report)}
                      disabled={downloadingId === report.id || !report.generatedText}
                    >
                      {downloadingId === report.id ? (
                        <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                      ) : (
                        <Download className="w-4 h-4 mr-1" />
                      )}
                      {downloadingId === report.id ? "生成中..." : "下载 PDF"}
                    </Button>
                  </div>
                </div>

                {/* Edit area */}
                {editingId === report.id && (
                  <div className="mt-4 space-y-3 border-t pt-4">
                    <Label>编辑报告内容（修改后点击保存，再下载 PDF）</Label>
                    <Textarea
                      value={editContent}
                      onChange={(e) => setEditContent(e.target.value)}
                      rows={15}
                      className="font-mono text-sm"
                    />
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => handleSaveEdit(report.id)}
                        disabled={updateReportMutation.isPending}
                      >
                        <Save className="w-4 h-4 mr-1" />
                        保存修改
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setEditingId(null)}
                      >
                        <X className="w-4 h-4 mr-1" />
                        取消
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-center text-gray-500 py-8">还没有报告。点击「创建新报告」开始生成！</p>
        )}
      </CardContent>
    </Card>
  );
}
