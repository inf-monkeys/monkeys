#!/bin/bash

# 数据浏览器组件同步脚本
# 用途：将 ui-admin 的数据管理组件同步到 ui 项目
# 使用方法：./scripts/sync-data-browser-components.sh

set -e

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 项目根目录
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SOURCE_DIR="$ROOT_DIR/ui-admin/src"
TARGET_DIR="$ROOT_DIR/ui/src"

echo -e "${GREEN}=== 数据浏览器组件同步脚本 ===${NC}\n"

# 检查源目录是否存在
if [ ! -d "$SOURCE_DIR" ]; then
    echo -e "${RED}错误：源目录不存在 $SOURCE_DIR${NC}"
    exit 1
fi

# 检查目标目录是否存在
if [ ! -d "$TARGET_DIR" ]; then
    echo -e "${RED}错误：目标目录不存在 $TARGET_DIR${NC}"
    exit 1
fi

# 同步组件
echo -e "${YELLOW}1. 同步数据管理组件...${NC}"
rsync -av --delete \
    "$SOURCE_DIR/components/admin/data/" \
    "$TARGET_DIR/components/data-browser/"
echo -e "${GREEN}✓ 组件同步完成${NC}\n"

# 同步类型定义
echo -e "${YELLOW}2. 同步类型定义文件...${NC}"
cp "$SOURCE_DIR/types/data.ts" "$TARGET_DIR/types/data.ts"
echo -e "${GREEN}✓ 类型文件同步完成${NC}\n"

# 同步 UI 组件
echo -e "${YELLOW}3. 同步依赖的 UI 组件...${NC}"
cp "$SOURCE_DIR/components/ui/media-preview.tsx" "$TARGET_DIR/components/ui/media-preview.tsx"
cp "$SOURCE_DIR/components/ui/infinite-scroll.tsx" "$TARGET_DIR/components/ui/infinite-scroll.tsx"
echo -e "${GREEN}✓ UI 组件同步完成${NC}\n"

# 显示差异统计
echo -e "${GREEN}=== 同步完成 ===${NC}"
echo -e "已同步以下文件："
echo "  - 5个数据管理组件"
echo "  - 1个类型定义文件"
echo "  - 2个 UI 组件"

echo -e "\n${YELLOW}注意事项：${NC}"
echo "  1. 同步后请检查 ui/src/pages/\$teamId/data-browser/index.lazy.tsx"
echo "  2. 确保只读模式的回调函数仍然正确（onEdit, onDelete 等应为 undefined）"
echo "  3. 运行 'cd ui && yarn build' 验证编译是否正常"

echo -e "\n${GREEN}✓ 全部完成！${NC}"
