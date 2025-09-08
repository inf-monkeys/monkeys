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

    // 支持带横线前缀的格式: - [x] task 和直接的 [x] task 格式
    const checkboxMatch = trimmedLine.match(/^(?:-\s*)?\[(.)\]\s*(.+)$/);

    if (checkboxMatch) {
      const [, statusChar, content] = checkboxMatch;
      let status: TodoStatus = 'pending';
      let completed = false;

      switch (statusChar.toLowerCase()) {
        case 'x':
          status = 'completed';
          completed = true;
          break;
        case '-':
          status = 'in_progress';
          completed = false;
          break;
        default:
          status = 'pending';
          completed = false;
      }

      const taskContent = content.trim();

      if (taskContent) {
        // 使用内容作为稳定的ID，这样同一任务的不同状态会被识别为同一项
        let contentHash = taskContent
          .toLowerCase()
          .replace(/\s+/g, '-')
          .replace(/[^\w-]/g, '');

        // 如果hash为空，使用内容长度和索引作为备用ID
        if (!contentHash) {
          contentHash = `item-${taskContent.length}-${items.length}`;
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
          content: taskContent,
          completed,
          status,
        });
      }
    }
  });

  return items;
};
