import { CompatibleAuthGuard } from '@/common/guards/auth.guard';
import { IRequest } from '@/common/typings/request';
import { Body, Controller, Get, Param, Post, Query, Request, Res, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Response } from 'express';
import { config } from '../../common/config';
import { AgentV2Repository } from './services/agent-v2.repository';
import { AgentV2Service } from './services/agent-v2.service';
import { AgentV2ConfigValidator, AgentV2CreationConfig } from './types/agent-creation-config.types';

export class CreateAgentV2Dto {
  name: string;
  description?: string;
  iconUrl?: string;

  // Agent configuration
  config: AgentV2CreationConfig;
}

export class StartSessionDto {
  initialMessage: string;
}

export class ContinueSessionDto {
  message: string;
}

export class ListAgentsQuery {
  page?: number = 1;
  limit?: number = 10;
  search?: string;
}

@ApiTags('Agent V2')
@ApiBearerAuth()
@UseGuards(CompatibleAuthGuard)
@Controller('agent-v2')
export class AgentV2Controller {
  constructor(
    private readonly agentService: AgentV2Service,
    private readonly agentRepository: AgentV2Repository,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Create a new agent' })
  @ApiResponse({ status: 201, description: 'Agent created successfully' })
  async createAgent(@Request() req: IRequest, @Body() createAgentDto: CreateAgentV2Dto) {
    const { teamId, userId } = req;

    // Validate agent configuration against global config
    const availableModels = config.agentv2.openaiCompatible.models;
    const validation = AgentV2ConfigValidator.validateCreationConfig(createAgentDto.config, availableModels);

    if (!validation.valid) {
      return {
        success: false,
        error: 'Invalid agent configuration',
        details: validation.errors,
      };
    }

    // Merge with defaults and prepare final config
    const finalConfig = AgentV2ConfigValidator.mergeWithDefaults(createAgentDto.config);

    const agent = await this.agentRepository.createAgent({
      name: createAgentDto.name,
      description: createAgentDto.description,
      teamId,
      createdBy: userId,
      iconUrl: createAgentDto.iconUrl,
      config: finalConfig, // Store the merged configuration
    });

    return {
      success: true,
      data: agent,
    };
  }

  @Get('available-models')
  @ApiOperation({ summary: 'Get available models for agent creation' })
  @ApiResponse({ status: 200, description: 'Available models retrieved successfully' })
  async getAvailableModels() {
    const { openaiCompatible, defaults } = config.agentv2;

    return {
      success: true,
      data: {
        models: openaiCompatible.models,
        defaults: {
          temperature: defaults.temperature,
          maxTokens: defaults.maxTokens,
          timeout: defaults.timeout,
        },
        constraints: {
          temperature: { min: 0, max: 2 },
          maxTokens: { min: 1, max: 100000 },
          timeout: { min: 1000, max: 300000 },
        },
      },
    };
  }

  @Get()
  @ApiOperation({ summary: 'List agents in team' })
  @ApiResponse({ status: 200, description: 'Agents retrieved successfully' })
  async listAgents(@Request() req: IRequest, @Query() query: ListAgentsQuery) {
    const { teamId } = req;

    const agents = await this.agentRepository.findAgentsByTeam(teamId, {
      page: query.page,
      limit: query.limit,
      search: query.search,
    });

    return {
      success: true,
      data: agents,
    };
  }

  @Get(':agentId')
  @ApiOperation({ summary: 'Get agent details' })
  @ApiResponse({ status: 200, description: 'Agent details retrieved successfully' })
  async getAgent(@Request() req: IRequest, @Param('agentId') agentId: string) {
    const { teamId } = req;

    const agent = await this.agentRepository.findAgentById(agentId);

    if (!agent) {
      return {
        success: false,
        error: 'Agent not found',
      };
    }

    // Team isolation check
    if (agent.teamId !== teamId) {
      return {
        success: false,
        error: 'Access denied: Agent not in your team',
      };
    }

    return {
      success: true,
      data: agent,
    };
  }

  @Post(':agentId/sessions/stream')
  @ApiOperation({ summary: 'Start a new streaming session with agent' })
  @ApiResponse({ status: 200, description: 'Streaming session started successfully' })
  async startStreamingSession(@Request() req: IRequest, @Param('agentId') agentId: string, @Body() startSessionDto: StartSessionDto, @Res() res: Response) {
    const { teamId, userId } = req;

    const agent = await this.agentRepository.findAgentById(agentId);

    if (!agent) {
      return res.status(404).json({
        success: false,
        error: 'Agent not found',
      });
    }

    // Team isolation check
    if (agent.teamId !== teamId) {
      return res.status(403).json({
        success: false,
        error: 'Access denied: Agent not in your team',
      });
    }

    try {
      // Set HTTP status code for successful streaming
      res.status(200);

      // Set SSE headers with proper encoding
      res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Headers', 'Cache-Control');

      // Send initial connection confirmation
      res.write(`event: session_start\n`);
      res.write(
        `data: ${JSON.stringify({
          type: 'session_start',
          message: 'SSE connection established',
          timestamp: new Date().toISOString(),
        })}\n\n`,
        'utf8',
      );

      // Flag to track if connection is still active
      let isConnected = true;

      // Handle client disconnect
      const cleanup = () => {
        isConnected = false;
      };

      res.on('close', cleanup);
      res.on('finish', cleanup);
      res.on('error', cleanup);

      // Start the session and get the context
      const context = await this.agentService.startNewSession(
        agentId,
        userId,
        startSessionDto.initialMessage,
        (chunk: string) => {
          if (isConnected) {
            // Send message chunks via SSE with proper encoding
            const data = JSON.stringify({ type: 'message_chunk', content: chunk, timestamp: new Date().toISOString() });
            res.write(`event: message\n`);
            res.write(`data: ${data}\n\n`, 'utf8');
          }
        },
        (toolCalls: any[]) => {
          if (isConnected) {
            // Send tool calls via SSE with proper encoding
            const data = JSON.stringify({ type: 'tool_calls', toolCalls, timestamp: new Date().toISOString() });
            res.write(`event: tool_calls\n`);
            res.write(`data: ${data}\n\n`, 'utf8');
          }
        },
        (tool: any, result: any) => {
          if (isConnected) {
            // Send tool execution result via SSE with proper encoding
            const data = JSON.stringify({
              type: 'tool_result',
              tool: {
                id: tool.id,
                name: tool.name,
                params: tool.params,
              },
              result: {
                success: result.success,
                output: result.output,
                error: result.error,
              },
              timestamp: new Date().toISOString(),
            });
            res.write(`event: tool_result\n`);
            res.write(`data: ${data}\n\n`, 'utf8');
          }
        },
        (finalMessage: string) => {
          if (isConnected) {
            // Send completion response via SSE - but don't end the connection
            // This allows for continuous conversation like agent-code
            const data = JSON.stringify({
              type: 'response_complete',
              message: finalMessage,
              sessionId: context.session.id,
              timestamp: new Date().toISOString(),
            });
            res.write(`event: response_complete\n`);
            res.write(`data: ${data}\n\n`, 'utf8');
            // Don't call res.end() - keep the connection alive for more messages
          }
        },
        (error: Error) => {
          if (isConnected) {
            // Send error via SSE with proper encoding
            const data = JSON.stringify({ type: 'error', error: error.message, timestamp: new Date().toISOString() });
            res.write(`event: error\n`);
            res.write(`data: ${data}\n\n`, 'utf8');
            res.end();
          }
          isConnected = false;
        },
        // Add followup question callback
        async (question: string, suggestions?: Array<{ answer: string; mode?: string }>) => {
          return new Promise<string>((resolve, reject) => {
            if (!isConnected) {
              reject(new Error('Connection lost'));
              return;
            }

            // Send followup question via SSE
            const questionData = JSON.stringify({
              type: 'followup_question',
              question,
              suggestions,
              sessionId: context.session.id,
              timestamp: new Date().toISOString(),
            });
            res.write(`event: followup_question\n`);
            res.write(`data: ${questionData}\n\n`, 'utf8');

            // Store the resolver to be called when user responds
            this.agentService.storeFollowupQuestionResolver(context.session.id, resolve);

            console.log(`Waiting for user response to followup question for session ${context.session.id}`);
          });
        },
      );

      // Send session metadata
      if (isConnected) {
        const sessionMetaData = JSON.stringify({
          type: 'session_metadata',
          sessionId: context.session.id,
          agentId: context.agent.id,
          message: 'Session initialized, starting conversation...',
          timestamp: new Date().toISOString(),
        });
        res.write(`event: session_metadata\n`);
        res.write(`data: ${sessionMetaData}\n\n`, 'utf8');
      }

      // Keep connection alive with periodic heartbeat
      const heartbeat = setInterval(() => {
        if (isConnected) {
          try {
            res.write(`event: heartbeat\n`);
            res.write(`data: ${JSON.stringify({ type: 'heartbeat', timestamp: new Date().toISOString() })}\n\n`, 'utf8');
          } catch (error) {
            clearInterval(heartbeat);
            isConnected = false;
          }
        } else {
          clearInterval(heartbeat);
        }
      }, 30000); // Send heartbeat every 30 seconds

      // Cleanup on disconnect
      res.on('close', () => {
        clearInterval(heartbeat);
        isConnected = false;
      });
    } catch (error) {
      const errorData = JSON.stringify({ type: 'error', error: error.message, timestamp: new Date().toISOString() });
      res.write(`event: error\n`);
      res.write(`data: ${errorData}\n\n`, 'utf8');
      res.end();
    }
  }

  @Get(':agentId/sessions')
  @ApiOperation({ summary: 'List sessions for agent' })
  @ApiResponse({ status: 200, description: 'Sessions retrieved successfully' })
  async listSessions(@Request() req: IRequest, @Param('agentId') agentId: string, @Query() query: { page?: number; limit?: number }) {
    const { teamId, userId } = req;

    const agent = await this.agentRepository.findAgentById(agentId);

    if (!agent) {
      return {
        success: false,
        error: 'Agent not found',
      };
    }

    // Team isolation check
    if (agent.teamId !== teamId) {
      return {
        success: false,
        error: 'Access denied: Agent not in your team',
      };
    }

    const sessions = await this.agentRepository.findSessionsByAgentAndUser(agentId, userId, {
      page: query.page || 1,
      limit: query.limit || 10,
    });

    return {
      success: true,
      data: sessions,
    };
  }

  @Post('sessions/:sessionId/continue/stream')
  @ApiOperation({ summary: 'Continue a session with streaming response' })
  @ApiResponse({ status: 200, description: 'Session continuation streaming successfully' })
  async continueSessionWithStream(@Request() req: IRequest, @Param('sessionId') sessionId: string, @Body() continueSessionDto: ContinueSessionDto, @Res() res: Response) {
    const { teamId, userId } = req;

    const session = await this.agentRepository.findSessionById(sessionId);

    if (!session) {
      return res.status(404).json({
        success: false,
        error: 'Session not found',
      });
    }

    // Check session belongs to user and agent belongs to team
    const agent = await this.agentRepository.findAgentById(session.agentId);
    if (!agent || agent.teamId !== teamId || session.userId !== userId) {
      return res.status(403).json({
        success: false,
        error: 'Access denied: Session not accessible',
      });
    }

    try {
      // Set SSE headers with proper encoding
      res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Headers', 'Cache-Control');

      // TODO: Implement continue session logic in service
      // For now, we'll simulate a response
      res.write(`event: session_continue\n`);
      res.write(
        `data: ${JSON.stringify({
          type: 'session_continue',
          sessionId: sessionId,
          message: 'Session continuation started',
        })}\n\n`,
      );

      // Simulate processing the message
      res.write(`event: message\n`);
      res.write(
        `data: ${JSON.stringify({
          type: 'message_chunk',
          content: `Processing your message: "${continueSessionDto.message}"...`,
        })}\n\n`,
      );

      // Complete the stream
      setTimeout(() => {
        res.write(`event: complete\n`);
        res.write(
          `data: ${JSON.stringify({
            type: 'complete',
            message: `Response to: ${continueSessionDto.message}`,
            sessionId: sessionId,
          })}\n\n`,
        );
        res.end();
      }, 1000);
    } catch (error) {
      res.write(`event: error\n`);
      res.write(`data: ${JSON.stringify({ type: 'error', error: error.message })}\n\n`);
      res.end();
    }
  }

  @Post('sessions/:sessionId/message')
  @ApiOperation({ summary: 'Send a message to a session (works for any session state)' })
  @ApiResponse({ status: 200, description: 'Message sent successfully' })
  async sendMessage(@Request() req: IRequest, @Param('sessionId') sessionId: string, @Body() body: { message: string }) {
    const { teamId, userId } = req;
    const { message } = body;

    const session = await this.agentRepository.findSessionById(sessionId);

    if (!session) {
      return {
        success: false,
        error: 'Session not found',
      };
    }

    // Check session belongs to user and agent belongs to team
    const agent = await this.agentRepository.findAgentById(session.agentId);
    if (!agent || agent.teamId !== teamId || session.userId !== userId) {
      return {
        success: false,
        error: 'Access denied: Session not accessible',
      };
    }

    try {
      await this.agentService.submitUserMessage(sessionId, message, userId);

      return {
        success: true,
        message: 'Message sent successfully',
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  @Get('sessions/:sessionId/messages')
  @ApiOperation({ summary: 'Get session messages' })
  @ApiResponse({ status: 200, description: 'Messages retrieved successfully' })
  async getSessionMessages(@Request() req: IRequest, @Param('sessionId') sessionId: string, @Query() query: { page?: number; limit?: number }) {
    const { teamId, userId } = req;

    const session = await this.agentRepository.findSessionById(sessionId);

    if (!session) {
      return {
        success: false,
        error: 'Session not found',
      };
    }

    // Check session belongs to user and agent belongs to team
    const agent = await this.agentRepository.findAgentById(session.agentId);
    if (!agent || agent.teamId !== teamId || session.userId !== userId) {
      return {
        success: false,
        error: 'Access denied: Session not accessible',
      };
    }

    const messages = await this.agentRepository.findMessagesBySession(sessionId, {
      page: query.page || 1,
      limit: query.limit || 50,
    });

    return {
      success: true,
      data: messages,
    };
  }

  @Get('sessions/:sessionId/status')
  @ApiOperation({ summary: 'Get session task status and processing state' })
  @ApiResponse({ status: 200, description: 'Session status retrieved successfully' })
  async getSessionStatus(@Request() req: IRequest, @Param('sessionId') sessionId: string) {
    const { teamId, userId } = req;

    const session = await this.agentRepository.findSessionById(sessionId);

    if (!session) {
      return {
        success: false,
        error: 'Session not found',
      };
    }

    // Check session belongs to user and agent belongs to team
    const agent = await this.agentRepository.findAgentById(session.agentId);
    if (!agent || agent.teamId !== teamId || session.userId !== userId) {
      return {
        success: false,
        error: 'Access denied: Session not accessible',
      };
    }

    try {
      const taskStatus = await this.agentService.getSessionTaskStatus(sessionId);
      const queueInfo = await this.agentService.getSessionQueueInfo(sessionId);
      const activeContext = this.agentService.getActiveContext(sessionId);

      return {
        success: true,
        data: {
          sessionId,
          taskStatus,
          queueInfo,
          isActive: !!activeContext,
          activeProcessing: activeContext ? true : false,
          contextInfo: activeContext
            ? {
                agentId: activeContext.agent.id,
                sessionId: activeContext.session.id,
              }
            : null,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  @Post('sessions/:sessionId/resume')
  @ApiOperation({ summary: 'Resume a stopped or idle session' })
  @ApiResponse({ status: 200, description: 'Session resumed successfully' })
  async resumeSession(@Request() req: IRequest, @Param('sessionId') sessionId: string) {
    const { teamId, userId } = req;

    const session = await this.agentRepository.findSessionById(sessionId);

    if (!session) {
      return {
        success: false,
        error: 'Session not found',
      };
    }

    // Check session belongs to user and agent belongs to team
    const agent = await this.agentRepository.findAgentById(session.agentId);
    if (!agent || agent.teamId !== teamId || session.userId !== userId) {
      return {
        success: false,
        error: 'Access denied: Session not accessible',
      };
    }

    try {
      const result = await this.agentService.resumeSession(sessionId);

      return {
        success: true,
        data: {
          sessionId,
          resumed: result.resumed,
          message: result.message,
          queuedMessages: result.queuedMessages,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  @Post('sessions/:sessionId/stop')
  @ApiOperation({ summary: 'Stop an active session' })
  @ApiResponse({ status: 200, description: 'Session stopped successfully' })
  async stopSession(@Request() req: IRequest, @Param('sessionId') sessionId: string) {
    const { teamId, userId } = req;

    const session = await this.agentRepository.findSessionById(sessionId);

    if (!session) {
      return {
        success: false,
        error: 'Session not found',
      };
    }

    // Check session belongs to user and agent belongs to team
    const agent = await this.agentRepository.findAgentById(session.agentId);
    if (!agent || agent.teamId !== teamId || session.userId !== userId) {
      return {
        success: false,
        error: 'Access denied: Session not accessible',
      };
    }

    try {
      await this.agentService.stopSession(sessionId);

      return {
        success: true,
        data: {
          sessionId,
          message: 'Session stopped successfully',
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  @Get('sessions/:sessionId/context-usage')
  @ApiOperation({ summary: 'Get session context usage and limits' })
  @ApiResponse({ status: 200, description: 'Context usage retrieved successfully' })
  async getSessionContextUsage(@Request() req: IRequest, @Param('sessionId') sessionId: string) {
    const { teamId, userId } = req;

    const session = await this.agentRepository.findSessionById(sessionId);

    if (!session) {
      return {
        success: false,
        error: 'Session not found',
      };
    }

    // Check session belongs to user and agent belongs to team
    const agent = await this.agentRepository.findAgentById(session.agentId);
    if (!agent || agent.teamId !== teamId || session.userId !== userId) {
      return {
        success: false,
        error: 'Access denied: Session not accessible',
      };
    }

    try {
      const contextUsage = await this.agentService.getSessionContextUsage(sessionId);

      return {
        success: true,
        data: contextUsage,
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  @Post('sessions/:sessionId/followup-answer')
  @ApiOperation({ summary: 'Submit answer to a followup question' })
  @ApiResponse({ status: 200, description: 'Answer submitted successfully' })
  async submitFollowupAnswer(@Request() req: IRequest, @Param('sessionId') sessionId: string, @Body() body: { answer: string }) {
    const { teamId, userId } = req;
    const { answer } = body;

    const session = await this.agentRepository.findSessionById(sessionId);

    if (!session) {
      return {
        success: false,
        error: 'Session not found',
      };
    }

    // Check session belongs to user and agent belongs to team
    const agent = await this.agentRepository.findAgentById(session.agentId);
    if (!agent || agent.teamId !== teamId || session.userId !== userId) {
      return {
        success: false,
        error: 'Access denied: Session not accessible',
      };
    }

    // Check if session is waiting for followup answer
    if (!this.agentService.isWaitingForFollowup(sessionId)) {
      return {
        success: false,
        error: 'Session is not waiting for a followup answer',
      };
    }

    try {
      // Submit the answer - this will resolve the waiting promise
      const submitted = this.agentService.submitFollowupAnswer(sessionId, answer);

      if (submitted) {
        return {
          success: true,
          message: 'Followup answer submitted successfully',
        };
      } else {
        return {
          success: false,
          error: 'Failed to submit followup answer',
        };
      }
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  }
}
