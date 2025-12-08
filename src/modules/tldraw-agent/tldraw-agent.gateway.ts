import { Injectable, Logger } from '@nestjs/common';
import { ConnectedSocket, MessageBody, OnGatewayConnection, OnGatewayDisconnect, SubscribeMessage, WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { TldrawAgentService } from './tldraw-agent.service';

type AgentClientToServer = {
  prompt: (payload: { message: string; bounds?: { x: number; y: number; w: number; h: number }; modelName?: string }) => void;
  cancel: () => void;
  reset: () => void;
};

type AgentServerToClient = {
  info: (payload: { message: string }) => void;
  delta: (payload: { content?: string; action?: any }) => void;
  done: (payload: { message: string }) => void;
  error: (payload: { message: string }) => void;
};

@Injectable()
@WebSocketGateway({
  namespace: '/tldraw-agent',
  cors: {
    origin: true,
    credentials: true,
  },
  transports: ['websocket', 'polling'],
  allowEIO3: true,
})
export class TldrawAgentGateway implements OnGatewayConnection, OnGatewayDisconnect {
  constructor(private readonly agentService: TldrawAgentService) {
    this.logger.log('[DEBUG] TldrawAgentGateway initialized');
  }
  private readonly logger = new Logger(TldrawAgentGateway.name);

  @WebSocketServer()
  public server!: Server<AgentClientToServer, AgentServerToClient>;

  handleConnection(client: Socket) {
    this.logger.log(`[DEBUG] WebSocket client connected: ${client.id}`);
    this.logger.log(`[DEBUG] Client headers:`, client.handshake.headers);
    this.logger.log(`[DEBUG] Client origin:`, client.handshake.headers.origin);
    this.logger.log(`[DEBUG] Client user-agent:`, client.handshake.headers['user-agent']);
    this.logger.log(`[DEBUG] Client address:`, client.handshake.address);
    this.logger.log(`[DEBUG] Client query:`, client.handshake.query);
    this.logger.log(`[DEBUG] Client transport:`, client.conn.transport.name);
    this.logger.log(`[DEBUG] Client upgrade:`, client.conn.upgraded);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`[DEBUG] WebSocket client disconnected: ${client.id}`);
    this.agentService.cancelSession(client.id);
  }

  @SubscribeMessage('prompt')
  async onPrompt(
    @ConnectedSocket() client: Socket,
    @MessageBody()
    body: { message: string; bounds?: { x: number; y: number; w: number; h: number }; modelName?: string; context?: any },
  ) {
    this.logger.log(`[DEBUG] Received prompt from client ${client.id}:`, body);

    if (!body?.message) {
      this.logger.warn(`[DEBUG] Empty message from client ${client.id}`);
      client.emit('error', { message: 'message 不能为空' });
      return;
    }

    await this.agentService.startStream(
      client.id,
      {
        message: body.message,
        bounds: body.bounds,
        modelName: body.modelName,
        context: body.context,
      },
      {
        onInfo: (message) => client.emit('info', { message }),
        onDelta: (payload) => client.emit('delta', payload),
        onDone: (message) => client.emit('done', { message }),
        onError: (message) => client.emit('error', { message }),
      },
    );
  }

  @SubscribeMessage('cancel')
  onCancel(@ConnectedSocket() client: Socket) {
    this.logger.log(`[DEBUG] Cancel request from client ${client.id}`);
    this.agentService.cancelSession(client.id);
  }

  @SubscribeMessage('reset')
  onReset(@ConnectedSocket() client: Socket) {
    this.logger.log(`[DEBUG] Reset request from client ${client.id}`);
    this.onCancel(client);
    client.emit('info', { message: '会话已重置' });
  }
}
