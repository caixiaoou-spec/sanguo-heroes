#!/bin/bash
# 三国英雄传——蔡博尧版 一键启动脚本

cd "$(dirname "$0")"

PORT=8080

# 检查端口是否被占用，自动换一个
while lsof -i :$PORT >/dev/null 2>&1; do
    PORT=$((PORT + 1))
done

echo "🎮 三国英雄传 启动中..."
echo "🌐 浏览器地址: http://localhost:$PORT"
echo "按 Ctrl+C 停止服务器"
echo ""

# 自动打开浏览器
open "http://localhost:$PORT" 2>/dev/null || xdg-open "http://localhost:$PORT" 2>/dev/null &

# 启动本地HTTP服务器
python3 -m http.server $PORT
