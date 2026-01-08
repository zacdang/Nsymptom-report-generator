import { Button } from "@/components/ui/button";
import { Link } from "wouter";

export default function Home() {
  return (
    <div 
      className="min-h-screen flex items-end justify-center px-8 pb-16"
      style={{
        backgroundImage: 'url(/home-background.jpg)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat'
      }}
    >
      <div className="text-center space-y-4 p-6 bg-white/50 backdrop-blur-md rounded-xl shadow-2xl max-w-xs">
        <img src="/logo.jpg" alt="Logo" className="h-12 w-auto mx-auto" />
        <h2 className="text-xl font-bold text-gray-900">症状报告生成系统</h2>
        <Link href="/login">
          <Button size="lg" className="w-full">
            登录
          </Button>
        </Link>
      </div>
    </div>
  );
}
