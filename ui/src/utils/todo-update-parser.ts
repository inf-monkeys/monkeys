// Todo 项目状态
export type TodoStatus = 'pending' | 'in_progress' | 'completed';

// Todo 项目接口
export interface ITodoUpdateItem {
  id: string;
  content: string;
  completed: boolean;
  status: TodoStatus; // 状态字段
}

// 解析 update_todo_list 的 todos 内容
export const parseTodoUpdateContent = (todosText: string): ITodoUpdateItem[] => {
  const items: ITodoUpdateItem[] = [];
  const lines = todosText.split('\n').filter((line) => line.trim());

  lines.forEach((line) => {
    const trimmedLine = line.trim();
    if (trimmedLine.startsWith('[') && trimmedLine.includes(']')) {
      // 解析不同的状态标记
      let status: TodoStatus = 'pending';
      let completed = false;

      if (trimmedLine.startsWith('[x]') || trimmedLine.startsWith('[X]')) {
        status = 'completed';
        completed = true;
      } else if (trimmedLine.startsWith('[-]')) {
        status = 'in_progress';
        completed = false;
      } else if (trimmedLine.startsWith('[ ]')) {
        status = 'pending';
        completed = false;
      }

      const content = trimmedLine.replace(/^\[([ xX-])\]\s*/, '').trim();

      if (content) {
        // 使用内容作为稳定的ID，这样同一任务的不同状态会被识别为同一项
        let contentHash = content
          .toLowerCase()
          .replace(/\s+/g, '-')
          .replace(/[^\w-]/g, '');

        // 如果hash为空，使用内容长度和索引作为备用ID
        if (!contentHash) {
          contentHash = `item-${content.length}-${items.length}`;
        }

        // 确保ID唯一性，如果重复则添加索引
        let finalId = `todo-${contentHash}`;
        let counter = 1;
        while (items.some((item) => item.id === finalId)) {
          finalId = `todo-${contentHash}-${counter}`;
          counter++;
        }

        items.push({
          id: finalId,
          content,
          completed,
          status,
        });
      }
    }
  });

  return items;
};
