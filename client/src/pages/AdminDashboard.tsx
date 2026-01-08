import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import SymptomsManagement from "@/components/admin/SymptomsManagement";
import EmployeesManagement from "@/components/admin/EmployeesManagement";
import ReportsView from "@/components/admin/ReportsView";

export default function AdminDashboard() {
  const [, setLocation] = useLocation();
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
    } else if (!isLoading && employee && employee.role !== "admin") {
      toast.error("访问被拒：仅限管理员");
      setLocation("/employee");
    }
  }, [employee, isLoading, setLocation]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>加载中...</p>
      </div>
    );
  }

  if (!employee || employee.role !== "admin") {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <img src="/logo.jpg" alt="Logo" className="h-12 w-auto" />
            <h1 className="text-2xl font-bold">管理员控制台</h1>
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
        <Tabs defaultValue="symptoms" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="symptoms">症状管理</TabsTrigger>
            <TabsTrigger value="employees">伙伴管理</TabsTrigger>
            <TabsTrigger value="reports">报告查看</TabsTrigger>
          </TabsList>

          <TabsContent value="symptoms" className="mt-6">
            <SymptomsManagement />
          </TabsContent>

          <TabsContent value="employees" className="mt-6">
            <EmployeesManagement />
          </TabsContent>

          <TabsContent value="reports" className="mt-6">
            <ReportsView />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
