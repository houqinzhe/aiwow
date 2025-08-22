'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import confetti from 'canvas-confetti';

export default function Home() {
  const [monthlySalary, setMonthlySalary] = useState<number>(0);
  const [isStarted, setIsStarted] = useState<boolean>(false);
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [currentTime, setCurrentTime] = useState<Date>(new Date());
  const [earnedAmount, setEarnedAmount] = useState<number>(0);
  const [lastCelebration, setLastCelebration] = useState<number>(0);

  // 每分钟更新时间和薪资
  useEffect(() => {
    if (!isStarted) return;

    const interval = setInterval(() => {
      const now = new Date();
      setCurrentTime(now);

      if (startTime) {
        const timeDiff = now.getTime() - startTime.getTime();
        const minutesDiff = timeDiff / (1000 * 60);
        const newEarnedAmount = (monthlySalary / 30 / 24 / 60) * minutesDiff;
        setEarnedAmount(newEarnedAmount);

        // 检查是否达到100元的倍数
        const currentHundreds = Math.floor(newEarnedAmount / 100);
        if (currentHundreds > lastCelebration) {
          setLastCelebration(currentHundreds);
          triggerConfetti();
        }
      }
    }, 1000); // 每秒更新一次，让显示更流畅

    return () => clearInterval(interval);
  }, [isStarted, startTime, monthlySalary, lastCelebration]);

  const handleStart = () => {
    if (monthlySalary <= 0) return;

    setIsStarted(true);
    setStartTime(new Date());
    setEarnedAmount(0);
    setLastCelebration(0);
  };

  const handleReset = () => {
    setIsStarted(false);
    setStartTime(null);
    setEarnedAmount(0);
    setLastCelebration(0);
    setMonthlySalary(0);
  };

  const triggerConfetti = () => {
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 }
    });
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('zh-CN', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      weekday: 'long'
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('zh-CN', {
      style: 'currency',
      currency: 'CNY',
      minimumFractionDigits: 2
    }).format(amount);
  };

  const getPerMinuteSalary = () => {
    return monthlySalary / 30 / 24 / 60;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <div className="inline-block p-4 rounded-2xl bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 shadow-lg mb-4">
            <h1 className="text-4xl font-bold text-white">💰 牛马计时器</h1>
          </div>
          <p className="text-gray-600">实时计算牛马每一分钟价值</p>
        </div>

        {!isStarted ? (
          <Card className="max-w-md mx-auto bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 border-0 shadow-xl">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl font-bold text-indigo-800">开始计时</CardTitle>
              <CardDescription className="text-indigo-600 text-lg">输入您的月薪开始计算</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <label htmlFor="salary" className="block text-sm font-semibold text-indigo-700 mb-3">
                  月薪 (元)
                </label>
                <Input
                  id="salary"
                  type="number"
                  placeholder="请输入您的月薪"
                  value={monthlySalary || ''}
                  onChange={(e) => setMonthlySalary(Number(e.target.value))}
                  className="text-lg text-center border-2 border-indigo-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all duration-300 h-12"
                />
              </div>
              <Button
                onClick={handleStart}
                disabled={monthlySalary <= 0}
                className="w-full h-12 text-lg font-bold bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 border-0 shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              >
                🚀 开始计时
              </Button>
            </CardContent>
          </Card> 
        ) : (
          <div className="space-y-10">
            {/* 当前时间显示 */}
            <Card className="bg-gradient-to-br from-blue-100 via-blue-200 to-indigo-200 border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="text-center text-2xl text-blue-800">🕐 当前时间</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center">
                  <div className="text-4xl font-mono font-bold text-blue-700 mb-2">
                    {formatTime(currentTime)}
                  </div>
                  <div className="text-lg text-blue-600">
                    {formatDate(currentTime)}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* 薪资信息 */}
            <div className="flex justify-center">
              <Card className="w-full border-0 bg-gradient-to-br from-emerald-100 via-teal-200 to-cyan-200 shadow-2xl transform hover:scale-105 transition-all duration-300">
                <CardHeader className="pb-2">
                  <CardTitle className="text-center text-2xl font-bold text-emerald-800">🎯 当前累计牛马所得</CardTitle>
                </CardHeader>
                <CardContent className="text-center pb-6">
                  <div className="text-5xl font-mono font-black text-emerald-700 mb-2">
                    {formatCurrency(earnedAmount)}
                  </div>
                  {/* <div className="text-sm text-orange-500 font-medium">
                    每分钟 +{formatCurrency(getPerMinuteSalary())}
                  </div> */}
                </CardContent>
              </Card>
            </div>

            {/* 广告展示区域 */}
            {/* <div className="text-center">
              <Card className="bg-gradient-to-br from-gray-50 to-gray-100 border border-gray-200 shadow-md">
                <CardContent className="p-6">
                  <div className="text-sm text-gray-500 mb-3">📢 广告位</div>
                  <div className="min-h-[100px] bg-gray-200 rounded-lg flex items-center justify-center">
                    <p className="text-gray-400 text-sm"></p>
                  </div>
                  <div className="text-xs text-gray-400 mt-2">
                    
                  </div>
                </CardContent>
              </Card>
            </div> */}

            {/* 操作按钮 */}
            <div className="text-center">
              <Button
                onClick={handleReset}
                variant="outline"
                size="lg"
                className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 border-0 text-white font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 px-8 py-3"
              >
                🔄 重新开始
              </Button>
            </div>

            {/* 提示信息 */}
            {/* <Card className="bg-yellow-50 border-yellow-200">
              <CardContent className="pt-6">
                <div className="text-center text-yellow-800">
                  <p className="text-lg">🎊 每当累计薪资达到100元时，将自动触发撒花庆祝！</p>
                  <p className="text-sm mt-2">当前进度: {Math.floor(earnedAmount)} / {Math.ceil(earnedAmount / 100) * 100} 元</p>
                </div>
              </CardContent>
            </Card> */}
          </div>
        )}
      </div>
    </div>
  );
}
