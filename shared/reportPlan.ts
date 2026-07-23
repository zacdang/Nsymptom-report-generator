export const SUMMARY_ADJUSTMENT_PLAN_MARKDOWN = [
  "## 五、总结调整方案",
  "",
  "### 第一步",
  "",
  "",
  "",
  "### 第二步",
  "",
  "",
  "",
  "### 第三步",
  "",
  "提供家庭饮食调整方案和21+7社群服务和三个月一对一辅导",
  "",
  "### 第四步",
  "",
  "进入调整期，一周会有明显感受，一个月建立起新的代谢平衡，3个月趋于正向循环，可进行检测指标对比。",
  "",
  "### 第五步",
  "",
  "第一时间反馈，及时调整指导，保证健康不走弯路",
].join("\n");

export function ensureSummaryAdjustmentPlan(markdown: string): string {
  if (markdown.includes("## 五、总结调整方案")) {
    return markdown;
  }

  return `${markdown.trimEnd()}\n\n${SUMMARY_ADJUSTMENT_PLAN_MARKDOWN}\n`;
}
