import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { ArrowLeft, Download, FileText, Users } from "lucide-react";

interface CreateReportProps {
  employeeId: number;
  onBack: () => void;
}

export default function CreateReport({ employeeId, onBack }: CreateReportProps) {
  const [generatedMarkdown, setGeneratedMarkdown] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedCustomerName, setSelectedCustomerName] = useState("");

  const utils = trpc.useUtils();

  // Fetch all customers bound to this employee
  const { data: myCustomers, isLoading: isLoadingCustomers } = trpc.questionnaire.myCustomers.useQuery();

  const generateReportMutation = trpc.questionnaire.generateReport.useMutation({
    onSuccess: (data) => {
      setGeneratedMarkdown(data.markdown);
      toast.success(`报告生成成功，匹配到 ${data.matchedCount} 条解析`);
      setIsGenerating(false);
    },
    onError: (error) => {
      toast.error(error.message || "生成报告失败");
      setIsGenerating(false);
    },
  });

  const createReportMutation = trpc.reports.create.useMutation({
    onSuccess: () => {
      toast.success("报告创建成功");
      utils.reports.list.invalidate();
      onBack();
    },
    onError: (error) => {
      toast.error(error.message || "创建报告失败");
    },
  });

  const handleGenerateFromQuestionnaire = (questionnaireId: number, customerName: string) => {
    setIsGenerating(true);
    setSelectedCustomerName(customerName);
    generateReportMutation.mutate({ id: questionnaireId });
  };

  const handleSave = () => {
    if (!generatedMarkdown) {
      toast.error("请先生成报告");
      return;
    }

    createReportMutation.mutate({
      employeeId,
      symptoms: `[问卷生成] ${selectedCustomerName}`,
      generatedText: generatedMarkdown,
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={onBack}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          返回
        </Button>
        <h2 className="text-xl font-semibold">创建新报告</h2>
      </div>

      {/* Customer List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            我的客户
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoadingCustomers ? (
            <p className="text-sm text-gray-500 text-center py-4">加载中...</p>
          ) : myCustomers && myCustomers.length > 0 ? (
            <div className="border rounded-lg divide-y">
              {myCustomers.map((customer: any) => (
                <div key={customer.id} className="p-4 flex items-center justify-between hover:bg-gray-50">
                  <div>
                    <p className="font-medium">{customer.name}</p>
                    <p className="text-sm text-gray-500">
                      {customer.gender === 'male' ? '男' : '女'} · {customer.ageRange} ·
                      提交于 {new Date(customer.createdAt).toLocaleDateString('zh-CN')}
                    </p>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => handleGenerateFromQuestionnaire(customer.id, customer.name)}
                    disabled={isGenerating}
                  >
                    <FileText className="w-4 h-4 mr-1" />
                    {isGenerating ? "生成中..." : "生成报告"}
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500 text-center py-4">
              暂无客户。客户填写问卷时需要填写您的用户名作为负责人。
            </p>
          )}
        </CardContent>
      </Card>

      {/* Generated Report */}
      {generatedMarkdown && (
        <Card>
          <CardHeader>
            <CardTitle>查看和编辑报告</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="markdown">Markdown 内容</Label>
              <Textarea
                id="markdown"
                value={generatedMarkdown}
                onChange={(e) => setGeneratedMarkdown(e.target.value)}
                rows={20}
              />
            </div>
            <div className="flex gap-2">
              <Button onClick={handleSave}>保存报告</Button>
              <Button 
                variant="outline" 
                onClick={async () => {
                  try {
                    const response = await fetch('/api/generate-pdf', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ markdownContent: generatedMarkdown }),
                    });
                    
                    if (!response.ok) throw new Error('PDF generation failed');
                    
                    const blob = await response.blob();
                    const url = window.URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `report-${selectedCustomerName}-${Date.now()}.pdf`;
                    document.body.appendChild(a);
                    a.click();
                    window.URL.revokeObjectURL(url);
                    document.body.removeChild(a);
                    toast.success('PDF 下载成功');
                  } catch (error) {
                    toast.error('生成 PDF 失败');
                  }
                }}
              >
                <Download className="w-4 h-4 mr-2" />
                下载 PDF
              </Button>
              <Button variant="ghost" onClick={() => setGeneratedMarkdown("")}>
                清空
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
