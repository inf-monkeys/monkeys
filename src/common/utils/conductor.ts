export const getForkedTasks = (allTasks: any[], currentTask: any) => {
  if (!currentTask) return;

  const queue = [currentTask];
  while (queue.length > 0) {
    const task = queue.shift();
    allTasks.push(task);
    Object.values(task.forkTasks || [])
      .concat(Object.values(task.decisionCases || {}))
      .concat(task.loopOver || [])
      .flat()
      .forEach((task) => {
        queue.push(task);
      });
  }
};

export const flatTasks = (tasks: any[]) => {
  const allTasks: Array<any> = [];
  for (const task of tasks) {
    getForkedTasks(allTasks, task);
  }
  return allTasks;
};
