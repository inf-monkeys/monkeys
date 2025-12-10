import defineNode from '@/common/utils/define-tool';
import { ToolType } from '@inf-monkeys/monkeys';

export default defineNode({
  type: ToolType.SIMPLE,
  name: 'send_message',
  categories: ['process'],
  displayName: {
    'zh-CN': '发送消息',
    'en-US': 'Send Message',
  },
  description: {
    'zh-CN': '发送消息给用户',
    'en-US': 'Send a message to the user',
  },
  icon: 'emoji:💬:#7fa3f8',
  input: [
    {
      displayName: {
        'zh-CN': '消息内容',
        'en-US': 'Message Content',
      },
      name: 'message',
      type: 'string',
      required: true,
    },
    {
      displayName: {
        'zh-CN': '操作意图',
        'en-US': 'Intent',
      },
      name: 'intent',
      type: 'string',
      required: false,
    },
  ],
  output: [
    {
      name: 'success',
      displayName: {
        'zh-CN': '成功',
        'en-US': 'Success',
      },
      type: 'boolean',
    },
    {
      name: 'message',
      displayName: {
        'zh-CN': '消息',
        'en-US': 'Message',
      },
      type: 'string',
    },
  ],
  extra: {
    estimateTime: 1,
  },
  handler: async (inputs: Record<string, any>, context) => {
    const { message, intent } = inputs;

    // 对于 send_message 工具，我们只需要返回成功状态
    // 实际的消息发送逻辑应该在调用方处理
    return {
      success: true,
      message: message || '消息已发送',
      result: {
        intent: intent || '发送消息',
        content: message,
        timestamp: new Date().toISOString(),
      },
    };
  },
});
