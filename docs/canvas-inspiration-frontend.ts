/**
 * Canvas Inspiration Push - 前端集成示例(带调试日志)
 *
 * 这个文件提供了完整的前端实现,包括详细的console日志输出
 * 将此代码集成到你的画布应用中
 */

class CanvasInspirationManager {
  private idleTimer: NodeJS.Timeout | null = null;
  private lastActivityTime: number = Date.now();
  private isEnabled: boolean = true;
  private readonly IDLE_TIMEOUT = 60000; // 60秒
  private readonly CHECK_INTERVAL = 1000; // 每秒检查一次
  private checkIntervalId: NodeJS.Timeout | null = null;

  constructor(
    private config: {
      teamId: string;
      userId: string;
      threadId: string;
      apiBaseUrl?: string;
      onInspirationPushed?: (result: any) => void;
    }
  ) {
    this.config.apiBaseUrl = this.config.apiBaseUrl || '';
    console.log('🎨 [CanvasInspiration] 初始化', {
      teamId: config.teamId,
      userId: config.userId,
      threadId: config.threadId,
      idleTimeout: `${this.IDLE_TIMEOUT / 1000}秒`,
    });

    this.startCountdownDisplay();
  }

  /**
   * 启动倒计时显示
   */
  private startCountdownDisplay() {
    if (this.checkIntervalId) {
      clearInterval(this.checkIntervalId);
    }

    this.checkIntervalId = setInterval(() => {
      const idleTime = Date.now() - this.lastActivityTime;
      const remainingTime = this.IDLE_TIMEOUT - idleTime;

      if (remainingTime > 0) {
        const seconds = Math.floor(remainingTime / 1000);

        // 每10秒打印一次
        if (seconds % 10 === 0) {
          console.log(`⏱️  [CanvasInspiration] 距离灵感推送: ${seconds}秒 (已无操作: ${Math.floor(idleTime / 1000)}秒)`);
        }

        // 最后10秒每秒打印
        if (seconds <= 10) {
          console.log(`⏰ [CanvasInspiration] 倒计时: ${seconds}秒...`);
        }
      }
    }, this.CHECK_INTERVAL);
  }

  /**
   * 记录用户活动
   */
  onActivity(activityType?: string) {
    if (!this.isEnabled) {
      return;
    }

    const now = Date.now();
    const idleTime = now - this.lastActivityTime;

    console.log(`👆 [CanvasInspiration] 用户操作: ${activityType || '未知'}`, {
      上次活动: `${Math.floor(idleTime / 1000)}秒前`,
      时间戳: new Date().toLocaleTimeString(),
    });

    this.lastActivityTime = now;

    // 重置计时器
    if (this.idleTimer) {
      clearTimeout(this.idleTimer);
    }

    // 启动新的计时器
    this.idleTimer = setTimeout(() => {
      this.triggerInspiration();
    }, this.IDLE_TIMEOUT);
  }

  /**
   * 触发灵感推送
   */
  private async triggerInspiration() {
    console.log('🚀 [CanvasInspiration] 触发灵感推送', {
      无操作时长: `${this.IDLE_TIMEOUT / 1000}秒`,
      当前时间: new Date().toLocaleString(),
    });

    try {
      // 1. 获取画布数据
      console.log('📊 [CanvasInspiration] 获取画布数据...');
      const canvasData = this.getCanvasData();

      console.log('📊 [CanvasInspiration] 画布数据:', {
        图形数量: canvasData.shapes.length,
        图形类型: this.getShapeTypesSummary(canvasData.shapes),
      });

      // 2. 检查是否应该推送
      console.log('🔍 [CanvasInspiration] 检查推送条件...');
      const shouldPush = await this.checkShouldPush();

      if (!shouldPush) {
        console.warn('⚠️  [CanvasInspiration] 不满足推送条件，跳过');
        return;
      }

      console.log('✅ [CanvasInspiration] 推送条件满足，开始推送...');

      // 3. 调用推送接口
      const startTime = Date.now();
      const result = await this.pushInspiration(canvasData);
      const duration = Date.now() - startTime;

      console.log('✨ [CanvasInspiration] 推送成功!', {
        耗时: `${duration}ms`,
        消息ID: result.messageId,
        创作状态: result.state,
        建议数量: result.suggestionCount,
      });

      // 4. 回调通知
      if (this.config.onInspirationPushed) {
        this.config.onInspirationPushed(result);
      }

    } catch (error) {
      console.error('❌ [CanvasInspiration] 推送失败:', error);
    }
  }

  /**
   * 获取画布数据
   * 这里需要根据你的实际画布实现来修改
   */
  private getCanvasData(): any {
    // TODO: 替换为实际的画布数据获取逻辑
    // 示例:
    // return {
    //   shapes: this.canvas.getAllShapes(),
    // };

    console.warn('⚠️  [CanvasInspiration] getCanvasData() 需要实现 - 当前返回空数据');
    return { shapes: [] };
  }

  /**
   * 检查是否应该推送
   */
  private async checkShouldPush(): Promise<boolean> {
    const url = `${this.config.apiBaseUrl}/agents/canvas/should-push-inspiration?threadId=${this.config.threadId}&teamId=${this.config.teamId}`;

    console.log('🔗 [CanvasInspiration] 请求URL:', url);

    try {
      const response = await fetch(url);
      const result = await response.json();

      console.log('📥 [CanvasInspiration] 检查结果:', result);

      return result.data?.shouldPush ?? true;
    } catch (error) {
      console.error('❌ [CanvasInspiration] 检查失败:', error);
      return true; // 失败时默认允许推送
    }
  }

  /**
   * 执行灵感推送
   */
  private async pushInspiration(canvasData: any): Promise<any> {
    const url = `${this.config.apiBaseUrl}/agents/canvas/push-inspiration`;

    console.log('🔗 [CanvasInspiration] 推送URL:', url);
    console.log('📤 [CanvasInspiration] 推送数据:', {
      teamId: this.config.teamId,
      userId: this.config.userId,
      threadId: this.config.threadId,
      shapesCount: canvasData.shapes.length,
    });

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        teamId: this.config.teamId,
        userId: this.config.userId,
        threadId: this.config.threadId,
        canvasData,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ [CanvasInspiration] HTTP错误:', {
        status: response.status,
        statusText: response.statusText,
        error: errorText,
      });
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const result = await response.json();
    console.log('📥 [CanvasInspiration] 推送响应:', result);

    return result.data;
  }

  /**
   * 获取图形类型统计
   */
  private getShapeTypesSummary(shapes: any[]): string {
    const types: Record<string, number> = {};
    shapes.forEach(shape => {
      const type = shape.type || 'unknown';
      types[type] = (types[type] || 0) + 1;
    });

    return Object.entries(types)
      .map(([type, count]) => `${type}:${count}`)
      .join(', ') || '无';
  }

  /**
   * 手动测试推送(使用测试接口)
   */
  async testPush(scenario: 'empty' | 'divergent' | 'convergent' | 'complex' = 'divergent') {
    console.log('🧪 [CanvasInspiration] 手动测试推送', { scenario });

    const url = `${this.config.apiBaseUrl}/agents/canvas/test-inspiration`;

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          teamId: this.config.teamId,
          userId: this.config.userId,
          threadId: this.config.threadId,
          scenario,
        }),
      });

      const result = await response.json();

      console.log('✅ [CanvasInspiration] 测试成功:', result);

      if (this.config.onInspirationPushed) {
        this.config.onInspirationPushed(result.data);
      }

      return result.data;
    } catch (error) {
      console.error('❌ [CanvasInspiration] 测试失败:', error);
      throw error;
    }
  }

  /**
   * 启用/禁用
   */
  setEnabled(enabled: boolean) {
    console.log(`${enabled ? '✅' : '⏸️ '} [CanvasInspiration] ${enabled ? '启用' : '禁用'}`);
    this.isEnabled = enabled;

    if (!enabled && this.idleTimer) {
      clearTimeout(this.idleTimer);
      this.idleTimer = null;
    }

    if (!enabled && this.checkIntervalId) {
      clearInterval(this.checkIntervalId);
      this.checkIntervalId = null;
    } else if (enabled && !this.checkIntervalId) {
      this.startCountdownDisplay();
    }
  }

  /**
   * 销毁
   */
  destroy() {
    console.log('🗑️  [CanvasInspiration] 销毁');

    if (this.idleTimer) {
      clearTimeout(this.idleTimer);
    }

    if (this.checkIntervalId) {
      clearInterval(this.checkIntervalId);
    }
  }
}

// ============ 使用示例 ============

// 1. 初始化
const inspirationManager = new CanvasInspirationManager({
  teamId: 'your-team-id',
  userId: 'your-user-id',
  threadId: 'your-thread-id',
  apiBaseUrl: '', // 留空使用相对路径,或填入完整URL如 'http://localhost:3000'

  // 可选: 推送成功后的回调
  onInspirationPushed: (result) => {
    console.log('🎉 收到灵感推送!', result);
    // 可以在这里显示通知、刷新消息列表等
    // showNotification('✨ AI为你推送了新的灵感建议');
  },
});

// 2. 监听画布操作事件
// 根据你的画布实现,在用户操作时调用 onActivity()

// 示例 1: 使用 addEventListener
// canvas.addEventListener('pointermove', () => {
//   inspirationManager.onActivity('pointer-move');
// });
//
// canvas.addEventListener('pointerdown', () => {
//   inspirationManager.onActivity('pointer-down');
// });
//
// canvas.addEventListener('change', () => {
//   inspirationManager.onActivity('canvas-change');
// });

// 示例 2: 如果使用 tldraw
// editor.on('change', () => {
//   inspirationManager.onActivity('editor-change');
// });

// 3. 全局暴露,方便在console测试
(window as any).inspirationManager = inspirationManager;

console.log(`
🎨 Canvas Inspiration Manager 已就绪!

在浏览器console中可以使用以下命令:

1. 手动触发测试推送:
   inspirationManager.testPush()
   inspirationManager.testPush('empty')      // 空画布
   inspirationManager.testPush('divergent')  // 发散状态
   inspirationManager.testPush('convergent') // 收敛状态
   inspirationManager.testPush('complex')    // 复杂场景

2. 模拟用户操作:
   inspirationManager.onActivity('test')

3. 禁用/启用:
   inspirationManager.setEnabled(false)  // 禁用
   inspirationManager.setEnabled(true)   // 启用

所有操作都会在console打印详细日志!
`);

export { CanvasInspirationManager };
