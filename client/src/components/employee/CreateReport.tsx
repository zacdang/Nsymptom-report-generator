import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { ArrowLeft, Download } from "lucide-react";

interface CreateReportProps {
  employeeId: number;
  onBack: () => void;
}

export default function CreateReport({ employeeId, onBack }: CreateReportProps) {
  const [symptomInput, setSymptomInput] = useState("");
  const [generatedMarkdown, setGeneratedMarkdown] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);

  const utils = trpc.useUtils();
  const { data: symptoms } = trpc.admin.symptoms.list.useQuery();

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

  const handleGenerate = () => {
    if (!symptomInput.trim()) {
      toast.error("请输入症状名称");
      return;
    }

    setIsGenerating(true);

    // Match symptoms by checking if symptom name appears anywhere in the input text
    // No need for specific delimiters - just check if the symptom keyword exists
    const matchedSymptoms = symptoms
      ?.filter((symptom) => {
        // Check if the symptom name appears in the input text
        return symptomInput.includes(symptom.name);
      })
      .sort((a, b) => a.displayOrder - b.displayOrder) || [];

    // Generate markdown report
    let markdown = "# 症状报告\n\n";
    markdown += "## 介绍\n\n";
    markdown += "本报告基于提供的症状信息生成。\n\n";
    markdown += "## 症状详情\n\n";

    if (matchedSymptoms.length === 0) {
      markdown += "未找到匹配的症状。\n\n";
      toast.warning("未找到匹配的症状");
    } else {
      matchedSymptoms.forEach((symptom) => {
        markdown += `### ${symptom!.name}\n\n`;
        markdown += `${symptom!.longText}\n\n`;
      });
    }

    setGeneratedMarkdown(markdown);
    setIsGenerating(false);
    toast.success(`匹配到 ${matchedSymptoms.length} 个症状`);
  };

  const handleSave = () => {
    if (!generatedMarkdown) {
      toast.error("请先生成报告");
      return;
    }

    createReportMutation.mutate({
      employeeId,
      symptomInput,
      markdownContent: generatedMarkdown,
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

      <Card>
        <CardHeader>
          <CardTitle>步骤 1：输入症状名称</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="symptomInput">
              症状描述（直接输入文字，系统会自动识别症状关键词）
            </Label>
            <Textarea
              id="symptomInput"
              value={symptomInput}
              onChange={(e) => setSymptomInput(e.target.value)}
              rows={6}
              placeholder="e.g., 我最近头痛发烧还有咳嗽"
            />
          </div>
          <Button onClick={handleGenerate} disabled={isGenerating}>
            {isGenerating ? "生成中..." : "生成报告"}
          </Button>
        </CardContent>
      </Card>

      {generatedMarkdown && (
        <Card>
          <CardHeader>
            <CardTitle>步骤 2：查看和编辑报告</CardTitle>
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
                    a.download = `report-${Date.now()}.pdf`;
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
