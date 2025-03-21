#!/bin/bash

# 创建临时目录
mkdir -p temp

# 下载哔哩哔哩的favicon
curl -L -o temp/favicon.png "https://www.bilibili.com/favicon.ico"

# 使用convert命令创建不同大小的图标
# 如果没有安装ImageMagick，需要先安装：brew install imagemagick
if command -v convert >/dev/null 2>&1; then
  convert temp/favicon.png -resize 16x16 images/icon16.png
  convert temp/favicon.png -resize 48x48 images/icon48.png
  convert temp/favicon.png -resize 128x128 images/icon128.png
  echo "图标创建成功！"
else
  echo "请先安装ImageMagick: brew install imagemagick"
  echo "然后重新运行此脚本"
fi

# 清理临时文件
rm -rf temp 