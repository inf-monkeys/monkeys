import { Injectable, NotFoundException } from '@nestjs/common';
import { MessageRepository } from '../repositories/message.repository';
import { ThreadRepository } from '../repositories/thread.repository';
import { MessageEntity, UIMessagePart, UIMessageMetadata } from '@/database/entities/agents/message.entity';

// AI SDK v6 消息类型
export type Message = {
  role: 'system' | 'user' | 'assistant';
  content: string | Array<{ type: string; [key: string]: any }>;
};

export interface CreateMessageDto {
  threadId: string;
  teamId: string;
  role: 'system' | 'user' | 'assistant';
  parts: UIMessagePart[];
  metadata?: UIMessageMetadata;
  parentId?: string;
  branchId?: string;
}

/**
 * Message 服务
 *
 * **职责**：
 * - Message CRUD 操作
 * - UIMessage 格式转换为 AI SDK 的 CoreMessage
 * - 消息历史管理
 */
@Injectable()
export class MessageService {
  constructor(
    private readonly messageRepository: MessageRepository,
    private readonly threadRepository: ThreadRepository,
  ) {}

  /**
   * 创建消息
   */
  async create(dto: CreateMessageDto): Promise<MessageEntity> {
    const message = await this.messageRepository.create(dto);

    // 更新 Thread 的 lastMessageAt
    await this.threadRepository.updateLastMessageAt(dto.threadId);

    return message;
  }

  /**
   * 保存用户消息
   */
  async saveUserMessage(options: {
    threadId: string;
    teamId: string;
    text: string;
    mediaIds?: string[];
  }): Promise<MessageEntity> {
    const parts: UIMessagePart[] = [{ type: 'text', text: options.text }];

    // 添加图片
    if (options.mediaIds && options.mediaIds.length > 0) {
      for (const mediaId of options.mediaIds) {
        parts.push({
          type: 'image',
          image: `/api/assets/media/${mediaId}`, // 假设这是图片 URL 格式
          mediaId,
        });
      }
    }

    return await this.create({
      threadId: options.threadId,
      teamId: options.teamId,
      role: 'user',
      parts,
    });
  }

  /**
   * 保存 assistant 消息
   */
  async saveAssistantMessage(options: {
    threadId: string;
    teamId: string;
    parts: UIMessagePart[];
    metadata?: UIMessageMetadata;
  }): Promise<MessageEntity> {
    return await this.create({
      threadId: options.threadId,
      teamId: options.teamId,
      role: 'assistant',
      parts: options.parts,
      metadata: options.metadata,
    });
  }

  /**
   * 保存系统消息
   */
  async saveSystemMessage(options: {
    threadId: string;
    teamId: string;
    text: string;
  }): Promise<MessageEntity> {
    return await this.create({
      threadId: options.threadId,
      teamId: options.teamId,
      role: 'system',
      parts: [{ type: 'text', text: options.text }],
    });
  }

  /**
   * 获取消息详情
   */
  async get(id: string, teamId?: string): Promise<MessageEntity> {
    const message = await this.messageRepository.findById(id);

    if (!message) {
      throw new NotFoundException(`Message ${id} not found`);
    }

    // 权限检查
    if (teamId && message.teamId !== teamId) {
      throw new NotFoundException(`Message ${id} not found in team ${teamId}`);
    }

    return message;
  }

  /**
   * 获取 Thread 的所有消息
   */
  async getThreadMessages(threadId: string, teamId?: string): Promise<MessageEntity[]> {
    const messages = await this.messageRepository.findByThreadId(threadId);

    // 权限检查
    if (teamId && messages.length > 0 && messages[0].teamId !== teamId) {
      return [];
    }

    return messages;
  }

  /**
   * 获取 Thread 的消息（分页）
   */
  async getThreadMessagesPaginated(
    threadId: string,
    limit: number = 50,
    offset: number = 0,
    teamId?: string,
  ): Promise<MessageEntity[]> {
    const messages = await this.messageRepository.findByThreadIdWithPagination(threadId, limit, offset);

    // 权限检查
    if (teamId && messages.length > 0 && messages[0].teamId !== teamId) {
      return [];
    }

    return messages;
  }

  /**
   * 转换为 AI SDK 的 CoreMessage 格式
   */
  async getThreadHistory(threadId: string, teamId?: string): Promise<Message[]> {
    const messages = await this.getThreadMessages(threadId, teamId);
    return this.convertToCoreMessages(messages);
  }

  /**
   * 将 UIMessage 转换为 CoreMessage
   */
  private convertToCoreMessages(messages: MessageEntity[]): Message[] {
    return messages
      .map((msg) => this.convertMessageToCoreMessage(msg))
      .filter((m) => m !== null) as Message[];
  }

  /**
   * 将单个 MessageEntity 转换为 CoreMessage
   */
  private convertMessageToCoreMessage(message: MessageEntity): Message | null {
    const role = message.role;

    if (role === 'system') {
      // System message
      const textParts = message.parts.filter((p) => p.type === 'text');
      if (textParts.length === 0) return null;

      return {
        role: 'system',
        content: textParts.map((p) => (p as any).text).join('\n'),
      };
    }

    if (role === 'user') {
      // User message
      const content: any[] = [];

      for (const part of message.parts) {
        if (part.type === 'text') {
          content.push({ type: 'text', text: part.text });
        } else if (part.type === 'image') {
          content.push({ type: 'image', image: part.image });
        }
      }

      if (content.length === 0) return null;

      return {
        role: 'user',
        content,
      };
    }

    if (role === 'assistant') {
      // Assistant message
      const content: any[] = [];
      const toolCalls: any[] = [];

      for (const part of message.parts) {
        if (part.type === 'text') {
          content.push({ type: 'text', text: part.text });
        } else if (part.type === 'reasoning') {
          // o1/o3 reasoning (不包含在 content 中，作为 metadata)
          // AI SDK 会自动处理
        } else if (part.type === 'tool-call') {
          toolCalls.push({
            type: 'tool-call',
            toolCallId: part.toolCallId,
            toolName: part.toolName,
            args: part.args,
          });
        }
      }

      if (content.length === 0 && toolCalls.length === 0) return null;

      return {
        role: 'assistant',
        content: [...content, ...toolCalls],
      };
    }

    return null;
  }

  /**
   * 删除消息
   */
  async delete(id: string, teamId?: string): Promise<void> {
    await this.get(id, teamId); // 权限检查
    await this.messageRepository.delete(id);
  }

  /**
   * 获取消息的分支
   */
  async getBranches(parentId: string, teamId?: string): Promise<MessageEntity[]> {
    await this.get(parentId, teamId); // 权限检查
    return await this.messageRepository.findByParentId(parentId);
  }
}
