// 测试定位功能的脚本
// 在浏览器控制台中运行

// 模拟定位API返回的数据
const mockLocationData = [
  {
    name: "Baoding",
    local_names: {
      zh: "保定市莲池区"
    },
    country: "CN",
    lat: 38.8671,
    lon: 115.4845
  }
];

// 测试城市名称提取逻辑
function testCityNameExtraction(data) {
  console.log('=== 测试城市名称提取 ===');
  console.log('原始数据:', data[0]);
  
  // 提取城市名称，优先使用中文名称
  let cityName = data[0].local_names?.zh || data[0].name;
  const englishName = data[0].name;
  
  console.log('原始城市名称:', cityName);
  console.log('英文城市名称:', englishName);
  
  // 如果城市名称包含"市"，去除"市"后缀
  if (cityName && cityName.includes('市')) {
    cityName = cityName.replace('市', '');
    console.log('去除"市"后缀后:', cityName);
  }
  
  // 如果仍然包含区县信息，尝试从英文名称中映射
  if (cityName && (cityName.includes('区') || cityName.includes('县'))) {
    console.log('检测到区县信息，尝试英文映射');
    
    // 模拟城市映射表
    const cityMapping = {
      '保定': 'Baoding',
      '北京': 'Beijing',
      '上海': 'Shanghai'
    };
    
    // 查找对应的中文城市名
    const chineseCity = Object.keys(cityMapping).find(key => 
      cityMapping[key] === englishName
    );
    
    if (chineseCity) {
      cityName = chineseCity;
      console.log('通过英文映射找到中文城市:', cityName);
    } else {
      // 如果找不到映射，直接使用英文名称
      cityName = englishName;
      console.log('使用英文名称:', cityName);
    }
  }
  
  // 如果中文名称仍然包含区县信息，尝试直接使用英文名称
  if (cityName && (cityName.includes('区') || cityName.includes('县'))) {
    cityName = englishName;
    console.log('最终使用英文名称:', cityName);
  }
  
  console.log('最终确定的城市名称:', cityName);
  return cityName;
}

// 测试不同的定位数据
console.log('测试1: 保定市莲池区');
testCityNameExtraction(mockLocationData);

console.log('\n测试2: 北京市朝阳区');
const mockBeijingData = [
  {
    name: "Beijing",
    local_names: {
      zh: "北京市朝阳区"
    },
    country: "CN",
    lat: 39.9042,
    lon: 116.4074
  }
];
testCityNameExtraction(mockBeijingData);

console.log('\n测试3: 上海市浦东新区');
const mockShanghaiData = [
  {
    name: "Shanghai",
    local_names: {
      zh: "上海市浦东新区"
    },
    country: "CN",
    lat: 31.2304,
    lon: 121.4737
  }
];
testCityNameExtraction(mockShanghaiData);

console.log('\n测试4: 只有英文名称');
const mockEnglishOnlyData = [
  {
    name: "Baoding",
    local_names: {},
    country: "CN",
    lat: 38.8671,
    lon: 115.4845
  }
];
testCityNameExtraction(mockEnglishOnlyData);
