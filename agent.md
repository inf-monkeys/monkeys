前端 assistant-ui + 后端 Vercel AI SDK V6

d.然后把设计项目里的智能体更换成新写的版本
2. 智能体技术选型
a.前端
i.用 assistant-ui 和 tool-ui 而不是 Vercel AI SDK UI，因为能力显著丰富，同时 assistant-ui 又整体上可以和 Vercel AI SDK 相对通常地联动
b.后端
i.用 Vercel AI SDK 而不是 Claude Agent SDK（Claude Code SDK），因为 Claude Code 只提供智能体层的实现，需要补的东西太多，Vercel AI SDK 的进展很快，看起来是够用的
ii.用 Vercel AI SDK V6 而不是 Vercel AI V5，因为强化了 Agent 实体（作为关键的 breaking change），增加了 HITL（Human in the loop），但是其他地方又相对少的改动（也许可以比较容易向下兼容只适配到 Vercel AI V5 的组件）
3. 智能体技术实现
	路线 A（阶段性选择）	路线 B	路线 C	路线 D
前端	UI 层	assistant-ui	assistant-ui	Vercel AI SDK UI	assistant-ui
		tool-ui	tool-ui		tool-ui
后端	框架层	Vercel AI SDK V6	Vercel AI SDK V5	Vercel AI SDK V6	Vercel AI SDK
	胶水层				ai-sdk-provider-claude-code
	智能体层				Claude Agent SDK
	工具层	Vercel AI SDK Tool	Vercel AI SDK Tool	Vercel AI SDK Tool	MCP
	数据层	monkeys	monkeys	monkeys	monkeys

Entity	我们的数据库的实体	Vercel AI SDK V6 的定义	assistant-ui 的定义
Agent	Agent（agents 表；可复用的“执行配置/版本”）

- id (uuid)
- name (string)
- model (string)
- instructions (text)
- toolsVersion (string) / tools(json)
- createdAt/updatedAt
建议：把 Agent 当“版本化配置”，线程只引用 agentId，避免配置漂移。	Agent≈ToolLoopAgent 
·
- 输入：model + system(instructions) + tools(ToolSet) + stopWhen/output...
- 运行：根据 session.agentId 加载配置，然后 streamText/generateText 或 ToolLoopAgent 执行
- 工具审批：tool.needsApproval + tool part(state=input-available) 等待补全结果	没有内置 Agent 实体

- 通过 Model Context / thread extras 暴露“当前 agentId/配置版本”给 UI 展示/切换
- useAssistantInstructions() 用于系统指令/提示词注入
- Tool UI Registry（makeAssistantTool/makeAssistantToolUI）负责工具渲染/交互
Thread	Thread

- id = threadId (uuid)
- agent_id (fk)
- title (string)
- metadata (json)
- state (json)
- createdAt/updatedAt/lastMessageAt
建议：state 存“可恢复运行”的状态（activeStreamId、pending toolCalls、长任务进度）。	没有内置的 Thread/Session

- 请求：携带 threadId + messages(UIMessage[])
- 后端：convertToModelMessages → streamText/ToolLoopAgent
- 输出：toUIMessageStreamResponse（流式按 message.id 增量更新 parts）
- 长任务：resumable streams 需要持久化 threadId↔activeStreamId/stream	ThreadRuntime

- threadId / messages / metadata / state / isRunning 等
- 多线程：ThreadListRuntime / useRemoteThreadListRuntime
- 若要自管 DB、分支、同步：优先 ExternalStoreRuntime（你控制 messages 与 parentId）
Message	Message（messages 表；建议以 UIMessage 作为主存格式）

- id (string/uuid)
- thread_id (fk)
- role (system|user|assistant)
- parts (json = UIMessage.parts)
- metadata (json = UIMessage.metadata)
- created_at (datetime)
可选：parent_id/branch_id（用于分支/重试）。	UIMessage = UI state source of truth

- parts：text / reasoning / tool-* / file / data-* / source-* / step-start
- 工具调用：toolCallId + state + input/output 在 tool part 里
- 持久化：流式同 message.id 增量更新；最终可在 onFinish 统一落库	ThreadMessage + MessageRuntime

- message.content(parts) 用 MessagePartPrimitive 渲染（text/reasoning/audio/tool-call）
- message.metadata 可直接展示 createdAt/model/tokens
- 分支：MessageRuntime.parentId/branches + BranchPickerPrimitive
Tool	Tool（tools 表；工具定义）

- name(toolName)
- description
- input_schema (JSON Schema)
- needs_approval (bool/policy)	tools(ToolSet)	
ToolCall	 ToolCall（tool_calls 表；调用实例）

- tool_call_id（幂等键）
- thread_id/message_id
- tool_name
- input/output
- status + is_error + error_text
- approval_status（可选）	Tool call/result

- tool call ≠ message：体现在 UIMessage.parts 的 tool-* part
- ToolUIPart.state：input-streaming → input-available → output-available / output-error
- needsApproval：停在 input-available，等待补 result 后继续	工具渲染/审批

- makeAssistantTool / makeAssistantToolUI：以 toolName 注册
- Tool UI props：toolCallId / args / result / isError / status(type: running|complete|incomplete|requires_action) / addResult
- 关键：toolCallId 全链路透传，才能把增量/结果/审批对齐

Entity	Field	DB	Vercel AI SDK V6（映射）	assistant-ui（映射）	Notes（贯通/落地建议）
Agent	id	agents.id (uuid/string)	ToolLoopAgent({ id? }) / Agent id	（无强制字段）可作为 model context 的版本/标识
	链路：agents.id → threads.agent_id → UI
- UI: thread extras/metadata 暴露 agentId
- Agent=版本化配置（model/instructions/tools）
	model	agents.model (string)	ToolLoopAgent({ model })	可放入 ModelConfig / thread extras
	链路：agents.model → 运行选型 → metadata.model → UI
- 把最终 model 写入 message.metadata（回放/计费）
- 同一 thread 可中途换 model：逐消息记录
	instructions	agents.instructions (text)	ToolLoopAgent({ instructions })	useAssistantInstructions()	链路：instructions → system → SDK → UI
- instructions 建议模板化+版本号（A/B/回放）
- system 消息优先后端统一注入
	tools	agents.tools (json) + tools 表	ToolLoopAgent({ tools }) / ToolSet	makeAssistantTool/toolUI 注册	链路：tools → ToolSet → parts(tool-*) → tool UI
- toolName 全链路唯一且稳定（建议带版本）
- 工具定义后端为准；UI 负责渲染/交互
