import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { trpc } from "@/lib/trpc";
import { format } from "date-fns";

export default function ReportsView() {
  const { data: reports, isLoading } = trpc.reports.list.useQuery({});

  return (
    <Card>
      <CardHeader>
        <CardTitle>所有报告</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <p>加载报告中...</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>伙伴 ID</TableHead>
                <TableHead>症状输入</TableHead>
                <TableHead>创建时间</TableHead>
                <TableHead>更新时间</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {reports?.map((report) => (
                <TableRow key={report.id}>
                  <TableCell>{report.id}</TableCell>
                  <TableCell>{report.employeeId}</TableCell>
                  <TableCell className="max-w-md truncate">{report.symptomInput}</TableCell>
                  <TableCell>{format(new Date(report.createdAt), "PPp")}</TableCell>
                  <TableCell>{format(new Date(report.updatedAt), "PPp")}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
