import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { trpc } from "@/lib/trpc";
import { format } from "date-fns";

interface ReportsListProps {
  employeeId: number;
}

export default function ReportsList({ employeeId }: ReportsListProps) {
  const { data: reports, isLoading } = trpc.reports.list.useQuery({ employeeId });

  return (
    <Card>
      <CardHeader>
        <CardTitle>我的报告</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <p>加载报告中...</p>
        ) : reports && reports.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>症状输入</TableHead>
                <TableHead>创建时间</TableHead>
                <TableHead>更新时间</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {reports.map((report) => (
                <TableRow key={report.id}>
                  <TableCell>{report.id}</TableCell>
                  <TableCell className="max-w-md truncate">{report.symptomInput}</TableCell>
                  <TableCell>{format(new Date(report.createdAt), "PPp")}</TableCell>
                  <TableCell>{format(new Date(report.updatedAt), "PPp")}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <p className="text-center text-gray-500 py-8">还没有报告。创建你的第一个报告！</p>
        )}
      </CardContent>
    </Card>
  );
}
