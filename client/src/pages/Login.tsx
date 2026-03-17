import { useState } from "react";
import { useLocation } from "wouter";
import { Input } from "@/components/ui/input";
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
      className="min-h-screen flex flex-col"
      style={{
        backgroundImage: 'url(/login-bg.webp)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat'
      }}
    >
      {/* Top spacer - 3 parts */}
      <div style={{ flex: 3 }} />

      {/* Tiny login card */}
      <div className="w-full flex justify-center px-4">
        <div
          className="backdrop-blur-sm shadow-2xl"
          style={{
            background: 'rgba(255,255,255,0.95)',
            borderRadius: '10px',
            width: '260px',
            padding: '14px 18px 16px',
          }}
        >
          <div className="text-center mb-2.5">
            <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#2d7a3a', marginBottom: '4px' }}>美食美塑</div>
            <div style={{ fontSize: '11px', fontWeight: 600, color: '#333', marginBottom: '1px' }}>症状报告生成系统</div>
            <div style={{ fontSize: '9px', color: '#888' }}>登录您的账户</div>
          </div>
          <form onSubmit={handleSubmit}>
            <div className="mb-2">
              <label style={{ display: 'block', fontSize: '9px', fontWeight: 500, color: '#555', marginBottom: '2px' }}>用户名</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                autoComplete="username"
                className="w-full outline-none focus:border-green-500"
                style={{ height: '26px', border: '1px solid #ddd', borderRadius: '4px', padding: '0 8px', fontSize: '11px' }}
              />
            </div>
            <div className="mb-2">
              <label style={{ display: 'block', fontSize: '9px', fontWeight: 500, color: '#555', marginBottom: '2px' }}>密码</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                className="w-full outline-none focus:border-green-500"
                style={{ height: '26px', border: '1px solid #ddd', borderRadius: '4px', padding: '0 8px', fontSize: '11px' }}
              />
            </div>
            <div className="flex justify-center mt-2.5">
              <button
                type="submit"
                disabled={isLoading}
                style={{
                  padding: '4px 20px',
                  fontSize: '10px',
                  fontWeight: 500,
                  color: 'white',
                  background: '#1a1a1a',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  opacity: isLoading ? 0.5 : 1,
                }}
              >
                {isLoading ? "登录中..." : "登录"}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Bottom spacer - 1 part */}
      <div style={{ flex: 1 }} />
    </div>
  );
}
