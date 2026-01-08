import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import ReportsList from "@/components/employee/ReportsList";
import CreateReport from "@/components/employee/CreateReport";

export default function EmployeeDashboard() {
  const [, setLocation] = useLocation();
  const [showCreateReport, setShowCreateReport] = useState(false);
  const { data: employee, isLoading } = trpc.employee.me.useQuery();
  const logoutMutation = trpc.employee.logout.useMutation({
    onSuccess: () => {
      toast.success("退出成功");
      setLocation("/login");
    },
  });

  useEffect(() => {
    if (!isLoading && !employee) {
      setLocation("/login");
    } else if (!isLoading && employee && employee.role === "admin") {
      // Redirect admins to admin dashboard
      setLocation("/admin");
    }
  }, [employee, isLoading, setLocation]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>加载中...</p>
      </div>
    );
  }

  if (!employee) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <img src="/logo.jpg" alt="Logo" className="h-12 w-auto" />
            <h1 className="text-2xl font-bold">伙伴工作台</h1>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600">欢迎，{employee.name}</span>
            <Button variant="outline" onClick={() => logoutMutation.mutate()}>
              退出
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {showCreateReport ? (
          <CreateReport
            employeeId={employee.id}
            onBack={() => setShowCreateReport(false)}
          />
        ) : (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">我的报告</h2>
              <Button onClick={() => setShowCreateReport(true)}>
                创建新报告
              </Button>
            </div>
            <ReportsList employeeId={employee.id} />
          </div>
        )}
      </main>
    </div>
  );
}
