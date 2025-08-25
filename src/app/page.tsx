'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface WeatherData {
  temp: number;
  humidity: number;
  pressure: number;
  windSpeed: number;
  windDeg: number;
  clouds: number;
  visibility: number;
  sunrise: number;
  sunset: number;
  description: string;
  icon: string;
}

interface FishingIndex {
  overall: number;
  temperature: number;
  pressure: number;
  wind: number;
  humidity: number;
  clouds: number;
}

interface LocationData {
  city: string;
  latitude: number;
  longitude: number;
}

interface FishingTimeAdvice {
  earlyBite: {
    start: string;
    end: string;
    duration: string;
    reason: string;
  };
  lateBite: {
    start: string;
    end: string;
    duration: string;
    reason: string;
  };
  bestTime: string;
  tips: string[];
}

interface ForecastDay {
  date: string;
  temp: {
    min: number;
    max: number;
  };
  weather: {
    description: string;
    icon: string;
  };
  humidity: number;
  pressure: number;
  windSpeed: number;
  windDeg: number;
  clouds: number;
  fishingIndex: number;
  fishingAdvice: string;
}

export default function Home() {
  const [cityInput, setCityInput] = useState<string>('保定');
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
  const [fishingIndex, setFishingIndex] = useState<FishingIndex | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<string>('--:--:--');
  const [showSuggestions, setShowSuggestions] = useState<boolean>(false);
  const [locationData, setLocationData] = useState<LocationData | null>(null);
  const [locationStatus, setLocationStatus] = useState<'idle' | 'locating' | 'success' | 'failed'>('idle');
  const [isCurrentLocation, setIsCurrentLocation] = useState<boolean>(false);
  const [fishingTimeAdvice, setFishingTimeAdvice] = useState<FishingTimeAdvice | null>(null);
  const [forecastData, setForecastData] = useState<ForecastDay[]>([]);
  const [showForecast, setShowForecast] = useState<boolean>(false);

  const API_KEY = 'ae0f28bee1c057dd05f8bb0a341efd46';

  // 更新时间
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString('zh-CN', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      }));
    };
    
    updateTime(); // 立即更新一次
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // 页面加载时自动获取当前位置
  useEffect(() => {
    // 只在组件挂载时执行一次
    const initLocation = () => {
      if (navigator.geolocation) {
        setLocationStatus('locating');
        
        navigator.geolocation.getCurrentPosition(
          async (position) => {
            const { latitude, longitude } = position.coords;
            
            try {
              // 使用OpenWeatherMap的reverse geocoding API获取城市名
              const response = await fetch(
                `https://api.openweathermap.org/geo/1.0/reverse?lat=${latitude}&lon=${longitude}&limit=1&appid=${API_KEY}&lang=zh_cn`
              );
              
              if (!response.ok) {
                throw new Error('无法获取城市信息');
              }
              
              const data = await response.json();
              
              if (data && data.length > 0) {
                const cityName = data[0].local_names?.zh || data[0].name;
                const location: LocationData = {
                  city: cityName,
                  latitude,
                  longitude
                };
                
                setLocationData(location);
                setLocationStatus('success');
                setIsCurrentLocation(true);
                
                // 自动获取当前位置的天气
                await fetchWeatherByCity(cityName, true);
              } else {
                throw new Error('无法解析城市信息');
              }
            } catch (error) {
              console.error('获取城市信息失败:', error);
              setLocationStatus('failed');
            }
          },
          (error) => {
            console.error('定位失败:', error);
            setLocationStatus('failed');
          },
          {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 60000
          }
        );
      } else {
        setLocationStatus('failed');
      }
    };

    initLocation();
  }, []);

  // 点击外部关闭城市建议
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (!target.closest('.city-search-container')) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // 获取当前位置
  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      setLocationStatus('failed');
      alert('您的浏览器不支持地理定位功能');
      return;
    }

    setLocationStatus('locating');
    
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        
        try {
          // 使用OpenWeatherMap的reverse geocoding API获取城市名
          const response = await fetch(
            `https://api.openweathermap.org/geo/1.0/reverse?lat=${latitude}&lon=${longitude}&limit=1&appid=${API_KEY}&lang=zh_cn`
          );
          
          if (!response.ok) {
            throw new Error('无法获取城市信息');
          }
          
          const data = await response.json();
          
          if (data && data.length > 0) {
            const cityName = data[0].local_names?.zh || data[0].name;
            const location: LocationData = {
              city: cityName,
              latitude,
              longitude
            };
            
            setLocationData(location);
            setLocationStatus('success');
            setIsCurrentLocation(true);
            
            // 自动获取当前位置的天气
            await fetchWeatherByCity(cityName, true);
          } else {
            throw new Error('无法解析城市信息');
          }
        } catch (error) {
          console.error('获取城市信息失败:', error);
          setLocationStatus('failed');
          alert('获取城市信息失败，请手动搜索城市');
        }
      },
      (error) => {
        console.error('定位失败:', error);
        setLocationStatus('failed');
        
        let errorMessage = '定位失败';
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = '定位权限被拒绝，请允许定位权限或手动搜索城市';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = '位置信息不可用，请手动搜索城市';
            break;
          case error.TIMEOUT:
            errorMessage = '定位超时，请手动搜索城市';
            break;
        }
        
        alert(errorMessage);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000
      }
    );
  };

  // 通过城市名获取天气（支持标记是否为当前位置）
  const fetchWeatherByCity = useCallback(async (cityName: string, isCurrent: boolean = false) => {
    if (!cityName.trim()) return;
    
    setLoading(true);
    setIsCurrentLocation(isCurrent);
    
    try {
      // 转换城市名称
      const englishCity = cityMapping[cityName] || cityName;
      
      // 获取当前天气
      const weatherResponse = await fetch(
        `https://api.openweathermap.org/data/2.5/weather?q=${englishCity}&appid=${API_KEY}&units=metric&lang=zh_cn`
      );
      
      if (!weatherResponse.ok) {
        throw new Error('城市未找到');
      }
      
      const weatherData = await weatherResponse.json();
      
      const weather: WeatherData = {
        temp: Math.round(weatherData.main.temp),
        humidity: weatherData.main.humidity,
        pressure: weatherData.main.pressure,
        windSpeed: Math.round(weatherData.wind.speed * 3.6), // 转换为km/h
        windDeg: weatherData.wind.deg,
        clouds: weatherData.clouds.all,
        visibility: weatherData.visibility / 1000, // 转换为km
        sunrise: weatherData.sys.sunrise,
        sunset: weatherData.sys.sunset,
        description: weatherData.weather[0].description,
        icon: weatherData.weather[0].icon
      };
      
      setWeatherData(weather);
      calculateFishingIndex(weather);
      
      // 计算早口晚口时间段
      const timeAdvice = calculateFishingTimes(weather.sunrise, weather.sunset, weather.temp, weather.description);
      setFishingTimeAdvice(timeAdvice);
      
      // 获取未来5天天气预报
      await fetchForecast(englishCity);
    } catch (error) {
      console.error('获取天气数据失败:', error);
      
      // 提供更友好的错误提示
      let errorMessage = '获取天气数据失败';
      
      if (error instanceof Error) {
        if (error.message.includes('city not found')) {
          errorMessage = `城市"${cityName}"未找到，请尝试：\n\n1. 检查城市名称是否正确\n2. 使用英文名称（如Beijing、Shanghai）\n3. 选择其他城市`;
        } else if (error.message.includes('rate limit')) {
          errorMessage = 'API请求过于频繁，请稍后再试';
        } else if (error.message.includes('network')) {
          errorMessage = '网络连接失败，请检查网络设置';
        }
      }
      
      alert(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  // 获取未来天气预报
  const fetchForecast = async (cityName: string) => {
    try {
      const response = await fetch(
        `https://api.openweathermap.org/data/2.5/forecast?q=${cityName}&appid=${API_KEY}&units=metric&lang=zh_cn`
      );
      
      if (!response.ok) {
        throw new Error('获取预报失败');
      }
      
      const data = await response.json();
      
      // 处理预报数据，每天取一个时间点（中午12点）
      const dailyForecasts: ForecastDay[] = [];
      const today = new Date();
      
      for (let i = 1; i <= 5; i++) {
        const targetDate = new Date(today);
        targetDate.setDate(today.getDate() + i);
        targetDate.setHours(12, 0, 0, 0);
        
        // 找到最接近中午12点的预报数据
        let closestForecast = data.list[0];
        let minDiff = Math.abs(new Date(data.list[0].dt * 1000).getTime() - targetDate.getTime());
        
        for (const forecast of data.list) {
          const forecastTime = new Date(forecast.dt * 1000);
          const diff = Math.abs(forecastTime.getTime() - targetDate.getTime());
          if (diff < minDiff) {
            minDiff = diff;
            closestForecast = forecast;
          }
        }
        
        // 计算钓鱼指数
        const temp = Math.round(closestForecast.main.temp);
        const humidity = closestForecast.main.humidity;
        const pressure = closestForecast.main.pressure;
        const windSpeed = Math.round(closestForecast.wind.speed * 3.6);
        const clouds = closestForecast.clouds.all;
        
        const fishingIndex = calculateSimpleFishingIndex(temp, pressure, windSpeed, humidity, clouds);
        const fishingAdvice = getSimpleFishingAdvice(fishingIndex);
        
        dailyForecasts.push({
          date: targetDate.toLocaleDateString('zh-CN', { month: 'long', day: 'numeric', weekday: 'long' }),
          temp: {
            min: Math.round(closestForecast.main.temp_min),
            max: Math.round(closestForecast.main.temp_max)
          },
          weather: {
            description: closestForecast.weather[0].description,
            icon: closestForecast.weather[0].icon
          },
          humidity,
          pressure,
          windSpeed,
          windDeg: closestForecast.wind.deg,
          clouds,
          fishingIndex,
          fishingAdvice
        });
      }
      
      setForecastData(dailyForecasts);
    } catch (error) {
      console.error('获取预报失败:', error);
    }
  };

  // 简化版钓鱼指数计算（用于预报）
  const calculateSimpleFishingIndex = (temp: number, pressure: number, windSpeed: number, humidity: number, clouds: number): number => {
    let tempIndex = 100;
    if (temp < 10 || temp > 30) tempIndex = 20;
    else if (temp < 15 || temp > 25) tempIndex = 60;
    else tempIndex = 100;

    let pressureIndex = 80;
    if (pressure >= 1013 && pressure <= 1020) pressureIndex = 100;
    else if (pressure < 1000 || pressure > 1030) pressureIndex = 40;

    let windIndex = 100;
    if (windSpeed > 20) windIndex = 20;
    else if (windSpeed > 15) windIndex = 40;
    else if (windSpeed > 10) windIndex = 60;
    else if (windSpeed > 5) windIndex = 80;

    let humidityIndex = 80;
    if (humidity >= 40 && humidity <= 70) humidityIndex = 100;
    else if (humidity < 30 || humidity > 80) humidityIndex = 50;

    let cloudsIndex = 80;
    if (clouds >= 30 && clouds <= 80) cloudsIndex = 100;
    else if (clouds > 90) cloudsIndex = 60;
    else cloudsIndex = 70;

    return Math.round((tempIndex + pressureIndex + windIndex + humidityIndex + cloudsIndex) / 5);
  };

  // 简化版钓鱼建议（用于预报）
  const getSimpleFishingAdvice = (index: number): string => {
    if (index >= 80) return '🎣 绝佳钓鱼时机';
    if (index >= 60) return '🐟 良好钓鱼条件';
    if (index >= 40) return '⚠️ 钓鱼条件一般';
    return '❌ 钓鱼条件较差';
  };

  // 城市名称映射
  const cityMapping: { [key: string]: string } = {
    // 直辖市
    '北京': 'Beijing',
    '上海': 'Shanghai',
    '天津': 'Tianjin',
    '重庆': 'Chongqing',
    
    // 省会城市
    '广州': 'Guangzhou',
    '深圳': 'Shenzhen',
    '杭州': 'Hangzhou',
    '南京': 'Nanjing',
    '武汉': 'Wuhan',
    '成都': 'Chengdu',
    '西安': 'Xian',
    '青岛': 'Qingdao',
    '大连': 'Dalian',
    '厦门': 'Xiamen',
    '苏州': 'Suzhou',
    '无锡': 'Wuxi',
    '宁波': 'Ningbo',
    '长沙': 'Changsha',
    '郑州': 'Zhengzhou',
    '济南': 'Jinan',
    '福州': 'Fuzhou',
    '哈尔滨': 'Harbin',
    '沈阳': 'Shenyang',
    '长春': 'Changchun',
    '石家庄': 'Shijiazhuang',
    '太原': 'Taiyuan',
    '呼和浩特': 'Hohhot',
    '银川': 'Yinchuan',
    '兰州': 'Lanzhou',
    '西宁': 'Xining',
    '乌鲁木齐': 'Urumqi',
    '拉萨': 'Lhasa',
    '昆明': 'Kunming',
    '贵阳': 'Guiyang',
    '南宁': 'Nanning',
    '海口': 'Haikou',
    
    // 特别行政区
    '台北': 'Taipei',
    '香港': 'Hong Kong',
    '澳门': 'Macau',
    
    // 河北省主要城市
    '保定': 'Baoding',
    '唐山': 'Tangshan',
    '秦皇岛': 'Qinhuangdao',
    '邯郸': 'Handan',
    '邢台': 'Xingtai',
    '张家口': 'Zhangjiakou',
    '承德': 'Chengde',
    '沧州': 'Cangzhou',
    '廊坊': 'Langfang',
    '衡水': 'Hengshui',
    '安新': 'Anxin',
    
    // 其他重要城市
    '徐州': 'Xuzhou',
    '常州': 'Changzhou',
    '南通': 'Nantong',
    '扬州': 'Yangzhou',
    '镇江': 'Zhenjiang',
    '泰州': 'Taizhou',
    '盐城': 'Yancheng',
    '连云港': 'Lianyungang',
    '宿迁': 'Suqian',
    '温州': 'Wenzhou',
    '嘉兴': 'Jiaxing',
    '湖州': 'Huzhou',
    '绍兴': 'Shaoxing',
    '金华': 'Jinhua',
    '衢州': 'Quzhou',
    '舟山': 'Zhoushan',
    '台州': 'Taizhou',
    '丽水': 'Lishui',
    '芜湖': 'Wuhu',
    '蚌埠': 'Bengbu',
    '淮南': 'Huainan',
    '马鞍山': 'Maanshan',
    '淮北': 'Huaibei',
    '铜陵': 'Tongling',
    '安庆': 'Anqing',
    '黄山': 'Huangshan',
    '滁州': 'Chuzhou',
    '阜阳': 'Fuyang',
    '宿州': 'Suzhou',
    '六安': 'Liuan',
    '亳州': 'Bozhou',
    '池州': 'Chizhou',
    '宣城': 'Xuancheng',
    '烟台': 'Yantai',
    '潍坊': 'Weifang',
    '济宁': 'Jining',
    '泰安': 'Taian',
    ' ': 'Weihai',
    '日照': 'Rizhao',
    '莱芜': 'Laiwu',
    '临沂': 'Linyi',
    '德州': 'Dezhou',
    '聊城': 'Liaocheng',
    '滨州': 'Binzhou',
    '菏泽': 'Heze',
    '洛阳': 'Luoyang',
    '开封': 'Kaifeng',
    '安阳': 'Anyang',
    '鹤壁': 'Hebi',
    '新乡': 'Xinxiang',
    '焦作': 'Jiaozuo',
    '濮阳': 'Puyang',
    '许昌': 'Xuchang',
    '漯河': 'Luohe',
    '三门峡': 'Sanmenxia',
    '南阳': 'Nanyang',
    '商丘': 'Shangqiu',
    '信阳': 'Xinyang',
    '周口': 'Zhoukou',
    '驻马店': 'Zhumadian',
    '济源': 'Jiyuan',
    '黄石': 'Huangshi',
    '十堰': 'Shiyan',
    '宜昌': 'Yichang',
    '襄阳': 'Xiangyang',
    '鄂州': 'Ezhou',
    '荆门': 'Jingmen',
    '孝感': 'Xiaogan',
    '荆州': 'Jingzhou',
    '黄冈': 'Huanggang',
    '咸宁': 'Xianning',
    '随州': 'Suizhou',
    '仙桃': 'Xiantao',
    '潜江': 'Qianjiang',
    '天门': 'Tianmen',
    '神农架': 'Shennongjia',
    '株洲': 'Zhuzhou',
    '湘潭': 'Xiangtan',
    '衡阳': 'Hengyang',
    '邵阳': 'Shaoyang',
    '岳阳': 'Yueyang',
    '常德': 'Changde',
    '张家界': 'Zhangjiajie',
    '益阳': 'Yiyang',
    '郴州': 'Chenzhou',
    '永州': 'Yongzhou',
    '怀化': 'Huaihua',
    '娄底': 'Loudi',
    '湘西': 'Xiangxi',
    '韶关': 'Shaoguan',
    '珠海': 'Zhuhai',
    '汕头': 'Shantou',
    '佛山': 'Foshan',
    '江门': 'Jiangmen',
    '湛江': 'Zhanjiang',
    '茂名': 'Maoming',
    '肇庆': 'Zhaoqing',
    '惠州': 'Huizhou',
    '梅州': 'Meizhou',
    '汕尾': 'Shanwei',
    '河源': 'Heyuan',
    '阳江': 'Yangjiang',
    '清远': 'Qingyuan',
    '东莞': 'Dongguan',
    '中山': 'Zhongshan',
    '潮州': 'Chaozhou',
    '揭阳': 'Jieyang',
    '云浮': 'Yunfu'
  };

  // 获取天气数据（手动搜索）
  const fetchWeather = async () => {
    if (!cityInput.trim()) return;
    await fetchWeatherByCity(cityInput, false);
  };

  // 计算钓鱼指数
  const calculateFishingIndex = (weather: WeatherData) => {
    // 温度指数 (15-25°C最佳)
    let tempIndex = 100;
    if (weather.temp < 10 || weather.temp > 30) tempIndex = 20;
    else if (weather.temp < 15 || weather.temp > 25) tempIndex = 60;
    else tempIndex = 100;

    // 气压指数 (稳定气压更好)
    let pressureIndex = 80; // 默认中等
    if (weather.pressure >= 1013 && weather.pressure <= 1020) pressureIndex = 100; // 稳定气压
    else if (weather.pressure < 1000 || weather.pressure > 1030) pressureIndex = 40; // 气压变化大

    // 风速指数 (微风最佳)
    let windIndex = 100;
    if (weather.windSpeed > 20) windIndex = 20; // 大风
    else if (weather.windSpeed > 15) windIndex = 40; // 中风
    else if (weather.windSpeed > 10) windIndex = 60; // 小风
    else if (weather.windSpeed > 5) windIndex = 80; // 微风
    else windIndex = 100; // 无风或轻风

    // 湿度指数 (适中湿度)
    let humidityIndex = 80;
    if (weather.humidity >= 40 && weather.humidity <= 70) humidityIndex = 100;
    else if (weather.humidity < 30 || weather.humidity > 80) humidityIndex = 50;

    // 云量指数 (多云天气鱼更活跃)
    let cloudsIndex = 80;
    if (weather.clouds >= 30 && weather.clouds <= 80) cloudsIndex = 100;
    else if (weather.clouds > 90) cloudsIndex = 60; // 阴天
    else cloudsIndex = 70; // 晴天

    // 综合指数
    const overall = Math.round((tempIndex + pressureIndex + windIndex + humidityIndex + cloudsIndex) / 5);

    setFishingIndex({
      overall,
      temperature: tempIndex,
      pressure: pressureIndex,
      wind: windIndex,
      humidity: humidityIndex,
      clouds: cloudsIndex
    });
  };

  // 获取城市建议
  const getCitySuggestions = (input: string) => {
    if (!input.trim()) return [];
    const suggestions = Object.keys(cityMapping).filter(
      city => city.toLowerCase().includes(input.toLowerCase())
    );
    return suggestions.slice(0, 5); // 最多显示5个建议
  };

  // 选择城市
  const selectCity = (selectedCity: string) => {
    setCityInput(selectedCity);
    setShowSuggestions(false);
  };

  // 获取风向文字
  const getWindDirection = (deg: number) => {
    const directions = ['北', '东北', '东', '东南', '南', '西南', '西', '西北'];
    const index = Math.round(deg / 45) % 8;
    return directions[index];
  };

  // 计算早口晚口时间段
  const calculateFishingTimes = (sunrise: number, sunset: number, temp: number, weather: string): FishingTimeAdvice => {
    const sunriseDate = new Date(sunrise * 1000);
    const sunsetDate = new Date(sunset * 1000);
    
    // 获取当前月份，用于季节判断
    const currentMonth = new Date().getMonth() + 1;
    
    // 根据季节调整时间范围
    let earlyOffset = 1.5; // 早口开始时间（日出前小时数）
    let earlyDuration = 2.5; // 早口持续时间
    let lateOffset = 2.5; // 晚口开始时间（日落前小时数）
    let lateDuration = 2.5; // 晚口持续时间
    
    // 季节调整
    if (currentMonth >= 3 && currentMonth <= 5) {
      // 春季：鱼类活跃，时间范围稍长
      earlyOffset = 1.5;
      earlyDuration = 3;
      lateOffset = 2.5;
      lateDuration = 3;
    } else if (currentMonth >= 6 && currentMonth <= 8) {
      // 夏季：温度高，鱼类活动时间集中
      earlyOffset = 2;
      earlyDuration = 2;
      lateOffset = 3;
      lateDuration = 2.5;
    } else if (currentMonth >= 9 && currentMonth <= 11) {
      // 秋季：鱼类觅食高峰期
      earlyOffset = 1.5;
      earlyDuration = 3;
      lateOffset = 2.5;
      lateDuration = 3;
    } else {
      // 冬季：鱼类活动减少，时间范围稍短
      earlyOffset = 1;
      earlyDuration = 2;
      lateOffset = 2;
      lateDuration = 2;
    }
    
    // 天气条件调整
    if (weather.includes('雨') || weather.includes('阴')) {
      // 阴雨天气，鱼类更活跃
      earlyDuration += 0.5;
      lateDuration += 0.5;
    } else if (weather.includes('晴') && temp > 30) {
      // 高温晴天，鱼类活动减少
      earlyDuration -= 0.5;
      lateDuration -= 0.5;
    }
    
    // 计算早口时间
    const earlyStart = new Date(sunriseDate.getTime() - earlyOffset * 60 * 60 * 1000);
    const earlyEnd = new Date(sunriseDate.getTime() + (earlyDuration - earlyOffset) * 60 * 60 * 1000);
    
    // 计算晚口时间
    const lateStart = new Date(sunsetDate.getTime() - lateOffset * 60 * 60 * 1000);
    const lateEnd = new Date(sunsetDate.getTime() + (lateDuration - lateOffset) * 60 * 60 * 1000);
    
    // 格式化时间
    const formatTime = (date: Date) => {
      return date.toLocaleTimeString('zh-CN', {
        hour: '2-digit',
        minute: '2-digit'
      });
    };
    
    // 计算持续时间
    const getDuration = (start: Date, end: Date) => {
      const diff = end.getTime() - start.getTime();
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      return `${hours}小时${minutes}分钟`;
    };
    
    // 判断最佳钓鱼时间
    let bestTime = '';
    if (currentMonth >= 3 && currentMonth <= 11) {
      bestTime = '早口时段';
    } else {
      bestTime = '晚口时段';
    }
    
    // 生成钓鱼技巧提示
    const tips = [];
    if (weather.includes('雨')) {
      tips.push('🌧️ 雨天鱼类更活跃，建议使用活饵');
    }
    if (temp >= 25 && temp <= 30) {
      tips.push('🌡️ 温度适宜，鱼类觅食活跃');
    }
    if (weather.includes('阴')) {
      tips.push('☁️ 阴天光线柔和，鱼类警惕性降低');
    }
    if (currentMonth >= 6 && currentMonth <= 8) {
      tips.push('☀️ 夏季建议避开正午高温时段');
    }
    
    return {
      earlyBite: {
        start: formatTime(earlyStart),
        end: formatTime(earlyEnd),
        duration: getDuration(earlyStart, earlyEnd),
        reason: `日出前${earlyOffset}小时到日出后${earlyDuration - earlyOffset}小时，鱼类觅食活跃`
      },
      lateBite: {
        start: formatTime(lateStart),
        end: formatTime(lateEnd),
        duration: getDuration(lateStart, lateEnd),
        reason: `日落前${lateOffset}小时到日落后${lateDuration - lateOffset}小时，鱼类觅食高峰期`
      },
      bestTime,
      tips
    };
  };

  // 获取钓鱼建议
  const getFishingAdvice = (index: FishingIndex) => {
    if (index.overall >= 80) return '🎣 绝佳钓鱼时机！鱼群活跃，建议使用活饵或软虫';
    if (index.overall >= 60) return '🐟 良好钓鱼条件，可以尝试多种钓法';
    if (index.overall >= 40) return '⚠️ 钓鱼条件一般，建议选择避风位置';
    return '❌ 钓鱼条件较差，建议改日再钓';
  };

  // 获取指数颜色
  const getIndexColor = (value: number) => {
    if (value >= 80) return 'text-green-600';
    if (value >= 60) return 'text-yellow-600';
    if (value >= 40) return 'text-orange-600';
    return 'text-red-600';
  };

  // 格式化时间
  const formatTime = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleTimeString('zh-CN', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };



  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-cyan-50 to-teal-100 p-4">
      <div className="max-w-6xl mx-auto">
        {/* 标题区域 */}
        <div className="text-center mb-8">
          <div className="inline-block p-4 rounded-2xl bg-gradient-to-r from-blue-500 via-cyan-500 to-teal-500 shadow-lg mb-4">
            <h1 className="text-4xl font-bold text-white">🎣 钓鱼天气助手</h1>
          </div>
          <p className="text-gray-600">专业的钓鱼天气分析，助您把握最佳钓鱼时机</p>
        </div>

                {/* 城市搜索 */}
        <Card className="max-w-md mx-auto bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 border-0 shadow-xl mb-8">
          <CardHeader className="text-center">
            <CardTitle className="text-xl font-bold text-indigo-800">选择城市</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* 定位状态显示 */}
            <div className="text-center mb-3">
              {locationStatus === 'locating' && (
                <div className="text-blue-600 text-sm">
                  📍 正在获取您的位置...
                </div>
              )}
              {locationStatus === 'success' && locationData && (
                <div className="text-green-600 text-sm">
                  📍 当前位置：{locationData.city}
                  <Button
                    onClick={getCurrentLocation}
                    size="sm"
                    variant="outline"
                    className="ml-2 h-6 px-2 text-xs"
                  >
                    刷新
                  </Button>
                </div>
              )}
              {locationStatus === 'failed' && (
                <div className="text-red-600 text-sm">
                  ❌ 定位失败，请手动搜索城市
                </div>
              )}
            </div>

            <div className="relative city-search-container">
              <div className="flex space-x-2">
                <Input
                  type="text"
                  placeholder="输入城市名称"
                  value={cityInput}
                  onChange={(e) => {
                    setCityInput(e.target.value);
                    setShowSuggestions(e.target.value.length > 0);
                  }}
                  onFocus={() => setCityInput.length > 0 && setShowSuggestions(true)}
                  className="flex-1 border-2 border-indigo-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                  onKeyPress={(e) => e.key === 'Enter' && fetchWeather()}
                />
                <Button
                  onClick={fetchWeather}
                  disabled={loading}
                  className="bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 border-0"
                >
                  {loading ? '查询中...' : '查询'}
                </Button>
              </div>
              
              {/* 城市建议 */}
              {showSuggestions && cityInput.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-10 max-h-48 overflow-y-auto">
                  {getCitySuggestions(cityInput).map((suggestion, index) => (
                    <div
                      key={index}
                      className="px-4 py-2 hover:bg-gray-100 cursor-pointer border-b border-gray-100 last:border-b-0"
                      onClick={() => selectCity(suggestion)}
                    >
                      {suggestion}
                    </div>
                  ))}
                  {getCitySuggestions(cityInput).length === 0 && (
                    <div className="px-4 py-2 text-gray-500 text-sm">
                      未找到匹配的城市，请直接输入英文名称
                    </div>
                  )}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* 当前时间显示 */}
        <Card className="bg-gradient-to-br from-blue-100 via-blue-200 to-indigo-200 border-0 shadow-lg mb-6">
          <CardHeader>
            <CardTitle className="text-center text-xl text-blue-800">🕐 当前时间</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center">
                              <div className="text-3xl font-mono font-bold text-blue-700 mb-2">
                  {currentTime}
                </div>
                <div className="text-lg text-blue-600">
                  {new Date().toLocaleDateString('zh-CN', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    weekday: 'long'
                  })}
                </div>
            </div>
          </CardContent>
        </Card>

        {weatherData && fishingIndex && (
          <div className="space-y-6">
            {/* 天气信息 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="bg-gradient-to-br from-cyan-100 via-blue-200 to-indigo-200 border-0 shadow-lg">
                <CardHeader>
                  <CardTitle className="text-center text-xl text-cyan-800">
                    🌤️ 当前天气
                    {isCurrentLocation && (
                      <span className="ml-2 text-sm bg-green-100 text-green-700 px-2 py-1 rounded-full">
                        📍 当前位置
                      </span>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-700">温度:</span>
                    <span className="font-bold text-xl">{weatherData.temp}°C</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-700">湿度:</span>
                    <span className="font-bold">{weatherData.humidity}%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-700">气压:</span>
                    <span className="font-bold">{weatherData.pressure} hPa</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-700">风速:</span>
                    <span className="font-bold">{weatherData.windSpeed} km/h</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-700">风向:</span>
                    <span className="font-bold">{getWindDirection(weatherData.windDeg)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-700">云量:</span>
                    <span className="font-bold">{weatherData.clouds}%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-700">能见度:</span>
                    <span className="font-bold">{weatherData.visibility} km</span>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-teal-100 via-green-200 to-emerald-200 border-0 shadow-lg">
                <CardHeader>
                  <CardTitle className="text-center text-xl text-teal-800">🌅 时间信息</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-700">日出:</span>
                    <span className="font-bold text-orange-600">{formatTime(weatherData.sunrise)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-700">日落:</span>
                    <span className="font-bold text-red-600">{formatTime(weatherData.sunset)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-700">天气:</span>
                    <span className="font-bold capitalize">{weatherData.description}</span>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* 钓鱼指数 */}
            <Card className="bg-gradient-to-br from-emerald-100 via-teal-200 to-cyan-200 border-0 shadow-2xl">
              <CardHeader>
                <CardTitle className="text-center text-2xl font-bold text-emerald-800">🎯 钓鱼指数分析</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* 综合指数 */}
                <div className="text-center">
                  <div className="text-5xl font-mono font-black text-emerald-700 mb-2">
                    {fishingIndex.overall}
                  </div>
                  <div className="text-lg text-emerald-600 font-semibold">
                    {getFishingAdvice(fishingIndex)}
                  </div>
                </div>

                {/* 详细指数 */}
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                  <div className="text-center">
                    <div className={`text-2xl font-bold ${getIndexColor(fishingIndex.temperature)}`}>
                      {fishingIndex.temperature}
                    </div>
                    <div className="text-sm text-gray-600">温度指数</div>
                  </div>
                  <div className="text-center">
                    <div className={`text-2xl font-bold ${getIndexColor(fishingIndex.pressure)}`}>
                      {fishingIndex.pressure}
                    </div>
                    <div className="text-sm text-gray-600">气压指数</div>
                  </div>
                  <div className="text-center">
                    <div className={`text-2xl font-bold ${getIndexColor(fishingIndex.wind)}`}>
                      {fishingIndex.wind}
                    </div>
                    <div className="text-sm text-gray-600">风速指数</div>
                  </div>
                  <div className="text-center">
                    <div className={`text-2xl font-bold ${getIndexColor(fishingIndex.humidity)}`}>
                      {fishingIndex.humidity}
                    </div>
                    <div className="text-sm text-gray-600">湿度指数</div>
                  </div>
                  <div className="text-center">
                    <div className={`text-2xl font-bold ${getIndexColor(fishingIndex.clouds)}`}>
                      {fishingIndex.clouds}
                    </div>
                    <div className="text-sm text-gray-600">云量指数</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* 早口晚口时间段建议 */}
            {fishingTimeAdvice && (
              <Card className="bg-gradient-to-br from-purple-50 via-pink-100 to-rose-100 border-0 shadow-lg">
                <CardHeader>
                  <CardTitle className="text-center text-xl text-purple-800">⏰ 最佳钓鱼时间段</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {/* 早口时段 */}
                    <div className="bg-white rounded-lg p-4 border-l-4 border-orange-400">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="text-lg font-bold text-orange-700">🌅 早口时段</h3>
                        <span className="text-sm bg-orange-100 text-orange-600 px-2 py-1 rounded-full">
                          {fishingTimeAdvice.earlyBite.duration}
                        </span>
                      </div>
                      <div className="text-center mb-3">
                        <div className="text-2xl font-mono font-bold text-orange-600">
                          {fishingTimeAdvice.earlyBite.start} - {fishingTimeAdvice.earlyBite.end}
                        </div>
                      </div>
                      <p className="text-sm text-gray-600 text-center">
                        {fishingTimeAdvice.earlyBite.reason}
                      </p>
                    </div>

                    {/* 晚口时段 */}
                    <div className="bg-white rounded-lg p-4 border-l-4 border-blue-400">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="text-lg font-bold text-blue-700">🌇 晚口时段</h3>
                        <span className="text-sm bg-blue-100 text-blue-600 px-2 py-1 rounded-full">
                          {fishingTimeAdvice.lateBite.duration}
                        </span>
                      </div>
                      <div className="text-center mb-3">
                        <div className="text-2xl font-mono font-bold text-blue-600">
                          {fishingTimeAdvice.lateBite.start} - {fishingTimeAdvice.lateBite.end}
                        </div>
                      </div>
                      <p className="text-sm text-gray-600 text-center">
                        {fishingTimeAdvice.lateBite.reason}
                      </p>
                    </div>

                    {/* 最佳时间推荐 */}
                    <div className="text-center">
                      <div className="inline-block bg-gradient-to-r from-purple-500 to-pink-500 text-white px-4 py-2 rounded-lg">
                        <span className="text-sm font-medium">🎯 今日推荐：{fishingTimeAdvice.bestTime}</span>
                      </div>
                    </div>

                    {/* 钓鱼技巧提示 */}
                    {fishingTimeAdvice.tips.length > 0 && (
                      <div className="bg-blue-50 rounded-lg p-4">
                        <h4 className="text-sm font-semibold text-blue-800 mb-2">💡 钓鱼技巧提示：</h4>
                        <div className="space-y-1">
                          {fishingTimeAdvice.tips.map((tip, index) => (
                            <p key={index} className="text-xs text-blue-700">{tip}</p>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* 未来天气预报 */}
            {forecastData.length > 0 && (
              <Card className="bg-gradient-to-br from-indigo-50 via-purple-100 to-pink-100 border-0 shadow-lg">
                <CardHeader>
                  <CardTitle className="text-center text-xl text-indigo-800">📅 未来5天天气预报</CardTitle>
                  <div className="text-center">
                    <Button
                      onClick={() => setShowForecast(!showForecast)}
                      variant="outline"
                      size="sm"
                      className="text-indigo-600 border-indigo-300 hover:bg-indigo-50"
                    >
                      {showForecast ? '收起预报' : '展开预报'}
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {showForecast && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {forecastData.map((day, index) => (
                        <div key={index} className="bg-white rounded-lg p-4 border border-indigo-200 hover:shadow-md transition-shadow">
                          <div className="text-center mb-3">
                            <div className="text-lg font-semibold text-indigo-800 mb-1">{day.date}</div>
                            <div className="text-2xl font-bold text-indigo-600">
                              {day.temp.min}°C - {day.temp.max}°C
                            </div>
                          </div>
                          
                          <div className="text-center mb-3">
                            <div className="text-sm text-gray-600 mb-1">{day.weather.description}</div>
                            <div className="text-lg">🌤️</div>
                          </div>
                          
                          <div className="space-y-2 text-xs text-gray-600">
                            <div className="flex justify-between">
                              <span>湿度:</span>
                              <span className="font-medium">{day.humidity}%</span>
                            </div>
                            <div className="flex justify-between">
                              <span>气压:</span>
                              <span className="font-medium">{day.pressure} hPa</span>
                            </div>
                            <div className="flex justify-between">
                              <span>风速:</span>
                              <span className="font-medium">{day.windSpeed} km/h</span>
                            </div>
                            <div className="flex justify-between">
                              <span>云量:</span>
                              <span className="font-medium">{day.clouds}%</span>
                            </div>
                          </div>
                          
                          <div className="mt-3 pt-3 border-t border-gray-200">
                            <div className="text-center">
                              <div className={`text-lg font-bold ${getIndexColor(day.fishingIndex)}`}>
                                {day.fishingIndex}
                              </div>
                              <div className="text-xs text-gray-600 mt-1">{day.fishingAdvice}</div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  
                  {!showForecast && (
                    <div className="text-center text-gray-600">
                      <p>点击&quot;展开预报&quot;查看未来5天的详细天气和钓鱼指数</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* 钓鱼建议 */}
            <Card className="bg-gradient-to-br from-yellow-50 via-orange-100 to-red-100 border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="text-center text-xl text-orange-800">💡 钓鱼策略建议</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 text-gray-700">
                  {fishingIndex.overall >= 80 && (
                    <>
                      <p>• 🎯 当前是绝佳的钓鱼时机，建议：</p>
                      <p>• 使用活饵或软虫，鱼群活跃度高</p>
                      <p>• 可以尝试多种钓法，如路亚、台钓等</p>
                      <p>• 选择开阔水域，鱼群分布广泛</p>
                    </>
                  )}
                  {fishingIndex.overall >= 60 && fishingIndex.overall < 80 && (
                    <>
                      <p>• 🐟 钓鱼条件良好，建议：</p>
                      <p>• 使用常规钓法，保持耐心</p>
                      <p>• 选择有遮蔽的位置，如树荫下</p>
                      <p>• 注意观察鱼群活动规律</p>
                    </>
                  )}
                  {fishingIndex.overall >= 40 && fishingIndex.overall < 60 && (
                    <>
                      <p>• ⚠️ 钓鱼条件一般，建议：</p>
                      <p>• 选择避风位置，减少风力影响</p>
                      <p>• 使用更敏感的钓具</p>
                      <p>• 调整钓鱼时间，避开不利时段</p>
                    </>
                  )}
                  {fishingIndex.overall < 40 && (
                    <>
                      <p>• ❌ 钓鱼条件较差，建议：</p>
                      <p>• 改日再钓，等待天气改善</p>
                      <p>• 或选择室内钓鱼场所</p>
                      <p>• 关注天气预报，选择合适时机</p>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* 使用说明 */}
        {!weatherData && (
          <Card className="bg-gradient-to-br from-gray-50 to-gray-100 border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="text-center text-xl text-gray-800">📖 使用说明</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center text-gray-600 space-y-2">
                <p>1. 🌍 <strong>自动定位</strong>：网页打开时自动获取您的位置并显示天气</p>
                <p>2. 🔍 <strong>手动搜索</strong>：在上方输入框中输入其他城市名称</p>
                <p>3. 📊 <strong>天气分析</strong>：系统自动计算钓鱼指数并给出建议</p>
                <p>4. 🎯 <strong>策略选择</strong>：根据指数选择合适的钓鱼时机和策略</p>
                <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                  <p className="text-sm text-blue-700 font-medium">💡 支持的城市：</p>
                  <p className="text-xs text-blue-600 mt-1">
                    直辖市：北京、上海、天津、重庆 | 省会：广州、深圳、杭州、南京、武汉、成都、西安、青岛、大连、厦门、苏州、无锡、宁波、长沙、郑州、济南、福州、哈尔滨、沈阳、长春、石家庄、太原、呼和浩特、银川、兰州、西宁、乌鲁木齐、拉萨、昆明、贵阳、南宁、海口、台北、香港、澳门 | 河北省：保定、唐山、秦皇岛、邯郸、邢台、张家口、承德、沧州、廊坊、衡水、安新 | 其他重要城市：徐州、常州、南通、扬州、镇江、温州、嘉兴、湖州、绍兴、金华、芜湖、蚌埠、烟台、潍坊、济宁、泰安、威海、日照、临沂、洛阳、开封、安阳、新乡、焦作、南阳、商丘、信阳、黄石、十堰、宜昌、襄阳、荆州、株洲、湘潭、衡阳、岳阳、常德、张家界、韶关、珠海、汕头、佛山、江门、湛江、茂名、肇庆、惠州、东莞、中山等
                  </p>
                </div>
                <div className="mt-3 p-3 bg-green-50 rounded-lg">
                  <p className="text-sm text-green-700 font-medium">📍 定位功能说明：</p>
                  <p className="text-xs text-green-600 mt-1">
                    首次访问时会请求定位权限，允许后可自动显示当前位置的天气信息。如果定位失败，默认显示保定的天气信息。您也可以随时手动搜索其他城市。
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
