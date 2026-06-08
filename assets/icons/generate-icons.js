// 生成 tabBar 图标
// 使用方法: 在浏览器中打开 index.html

const fs = require('fs');
const path = require('path');

// 创建简单的 1x1 像素 PNG 作为占位符
// 实际项目中应该使用真实的图标文件
function createPlaceholderPNG() {
  // 最小的 PNG 文件 (1x1 像素，灰色)
  const grayPNG = Buffer.from([
    0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, // PNG signature
    0x00, 0x00, 0x00, 0x0D, 0x49, 0x48, 0x44, 0x52, // IHDR chunk
    0x00, 0x00, 0x00, 0x51, 0x00, 0x00, 0x00, 0x51, // 81x81
    0x08, 0x02, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, // 8-bit RGB
    0x00, 0x00, 0x00, 0x00, 0x49, 0x45, 0x4E, 0x44, // IEND
    0xAE, 0x42, 0x60, 0x82
  ]);
  
  return grayPNG;
}

// 图标文件名
const iconFiles = [
  'bill.png',
  'bill-active.png',
  'stats.png',
  'stats-active.png',
  'family.png',
  'family-active.png',
  'profile.png',
  'profile-active.png'
];

// 创建图标目录
const iconsDir = __dirname;

// 生成占位图标
iconFiles.forEach(filename => {
  const filePath = path.join(iconsDir, filename);
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, createPlaceholderPNG());
    console.log(`Created: ${filename}`);
  }
});

console.log('图标占位符已生成。请替换为实际的图标文件。');
console.log('图标尺寸建议: 81x81 像素，PNG 格式');
