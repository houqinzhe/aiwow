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
          <h1 className="text-4xl font-bold text-gray-800 mb-2">💰 牛马计时器</h1>
          <p className="text-gray-600">实时计算牛马每一分钟价值</p>
        </div>

        {!isStarted ? (
          <Card className="max-w-md mx-auto">
            <CardHeader>
              <CardTitle>开始计时</CardTitle>
              <CardDescription>输入您的月薪开始计算</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label htmlFor="salary" className="block text-sm font-medium text-gray-700 mb-2">
                  月薪 (元)
                </label>
                <Input
                  id="salary"
                  type="number"
                  placeholder="请输入您的月薪"
                  value={monthlySalary || ''}
                  onChange={(e) => setMonthlySalary(Number(e.target.value))}
                  className="text-lg"
                />
              </div>
              <Button 
                onClick={handleStart} 
                disabled={monthlySalary <= 0}
                className="w-full"
                size="lg"
              >
                开始计时
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {/* 当前时间显示 */}
            <Card>
              <CardHeader>
                <CardTitle className="text-center text-2xl">🕐 当前时间</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center">
                  <div className="text-4xl font-mono font-bold text-blue-600 mb-2">
                    {formatTime(currentTime)}
                  </div>
                  <div className="text-lg text-gray-600">
                    {formatDate(currentTime)}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* 薪资信息 */}
            <div className="flex justify-center">
              <Card className="max-w-lg border-4 border-orange-300 bg-gradient-to-br from-orange-50 to-yellow-50 shadow-2xl transform hover:scale-105 transition-all duration-300">
                <CardHeader className="pb-2">
                  <CardTitle className="text-center text-2xl font-bold text-orange-700">🎯 当前累计牛马所得</CardTitle>
                </CardHeader>
                <CardContent className="text-center pb-6">
                  <div className="text-5xl font-mono font-black text-orange-600 mb-2">
                    {formatCurrency(earnedAmount)}
                  </div>
                  {/* <div className="text-sm text-orange-500 font-medium">
                    每分钟 +{formatCurrency(getPerMinuteSalary())}
                  </div> */}
                </CardContent>
              </Card>
            </div>

            {/* 操作按钮 */}
            <div className="text-center">
              <Button 
                onClick={handleReset} 
                variant="outline" 
                size="lg"
              >
                重新开始
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
