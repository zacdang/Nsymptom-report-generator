import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

export default function Login() {
  const [, setLocation] = useLocation();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const loginMutation = trpc.employee.login.useMutation({
    onSuccess: (data) => {
      toast.success("登录成功！");
      // Redirect based on role
      if (data.employee.role === "admin") {
        setLocation("/admin");
      } else {
        setLocation("/employee");
      }
    },
    onError: (error) => {
      toast.error(error.message || "登录失败");
      setIsLoading(false);
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    loginMutation.mutate({ username, password });
  };

  return (
    <div 
      className="min-h-screen flex flex-col items-center justify-between py-8"
      style={{
        backgroundImage: 'url(/login-bg.webp)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat'
      }}
    >
      {/* Spacer to push card to center area */}
      <div className="flex-1" />
      
      {/* Login card */}
      <Card className="w-full max-w-sm bg-white/95 backdrop-blur-sm shadow-2xl">
        <CardHeader className="text-center pb-2">
          <img src="/logo.jpg" alt="Logo" className="h-14 w-auto mx-auto mb-2" />
          <CardTitle className="text-base">症状报告生成系统</CardTitle>
          <CardDescription className="text-xs">登录您的账户</CardDescription>
        </CardHeader>
        <CardContent className="pb-4">
          <form id="loginForm" onSubmit={handleSubmit} className="space-y-3">
            <div className="space-y-1">
              <Label htmlFor="username" className="text-xs">用户名</Label>
              <Input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                autoComplete="username"
                className="h-8 text-sm"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="password" className="text-xs">密码</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                className="h-8 text-sm"
              />
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Spacer to push button to bottom */}
      <div className="flex-1" />

      {/* Small button at the bottom of the page */}
      <button
        type="submit"
        form="loginForm"
        disabled={isLoading}
        className="px-6 py-1.5 text-xs font-medium text-white bg-primary hover:bg-primary/90 rounded-md shadow-lg disabled:opacity-50 transition-colors mb-4"
      >
        {isLoading ? "登录中..." : "登录"}
      </button>
    </div>
  );
}
