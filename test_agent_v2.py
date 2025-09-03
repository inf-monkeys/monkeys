#!/usr/bin/env python3
"""
Agent V2 API Comprehensive Test Script
全面测试智能体V2 API的所有功能

使用方法:
python test_agent_v2.py [--quick] [--base-url URL]

测试的API端点:
- GET /api/agent-v2/available-models - 获取可用模型
- POST /api/agent-v2 - 创建智能体
- GET /api/agent-v2 - 列出智能体
- GET /api/agent-v2/:agentId - 获取智能体详情
- POST /api/agent-v2/:agentId/sessions/stream - 流式会话
- GET /api/agent-v2/:agentId/sessions - 列出会话
- POST /api/agent-v2/sessions/:sessionId/message - 发送消息
- GET /api/agent-v2/sessions/:sessionId/messages - 获取消息
- GET /api/agent-v2/sessions/:sessionId/status - 获取状态
- POST /api/agent-v2/sessions/:sessionId/resume - 恢复会话
- POST /api/agent-v2/sessions/:sessionId/stop - 停止会话
- GET /api/agent-v2/sessions/:sessionId/context-usage - 上下文使用情况
"""

import json
import time
import uuid
import argparse
import sys
from typing import Any, Dict, Optional

import requests
try:
    import sseclient  # pip install sseclient-py
    SSE_AVAILABLE = True
except ImportError:
    SSE_AVAILABLE = False


class AgentV2Tester:
    def __init__(self, base_url: str = "http://localhost:80", quick_mode: bool = False):
        self.base_url = base_url
        self.quick_mode = quick_mode
        self.token: Optional[str] = None
        self.user_id: Optional[str] = None
        self.team_id: Optional[str] = None
        
        # 测试用户信息
        self.test_email = f"test-{uuid.uuid4().hex[:8]}@example.com"
        self.test_password = "TestPass123"
        
        # 测试结果统计
        self.test_results = {
            'passed': 0,
            'failed': 0,
            'skipped': 0,
            'errors': []
        }
        
        # 测试数据存储
        self.test_agent_id: Optional[str] = None
        self.test_session_id: Optional[str] = None
        
    def log(self, message: str, level: str = "INFO"):
        """统一日志输出"""
        prefix = {
            'INFO': '📋',
            'SUCCESS': '✅',
            'ERROR': '❌',
            'WARNING': '⚠️',
            'DEBUG': '🔍'
        }.get(level, '📋')
        print(f"{prefix} {message}")
        
    def log_test_result(self, test_name: str, passed: bool, message: str = "", error: str = ""):
        """记录测试结果"""
        if passed:
            self.test_results['passed'] += 1
            self.log(f"PASS: {test_name} - {message}", "SUCCESS")
        else:
            self.test_results['failed'] += 1
            self.log(f"FAIL: {test_name} - {message}", "ERROR")
            if error:
                self.test_results['errors'].append(f"{test_name}: {error}")
    
    def _make_request(self, method: str, endpoint: str, **kwargs) -> requests.Response:
        """发送HTTP请求的通用方法"""
        url = f"{self.base_url}{endpoint}"
        headers = kwargs.get('headers', {})
        
        if self.token:
            headers['Authorization'] = f'Bearer {self.token}'
        if self.team_id:
            headers['x-monkeys-teamid'] = self.team_id
            
        kwargs['headers'] = headers
        
        self.log(f"{method.upper()} {url}", "DEBUG")
        if 'json' in kwargs:
            self.log(f"Request: {json.dumps(kwargs['json'], indent=2, ensure_ascii=False)}", "DEBUG")
            
        try:
            response = getattr(requests, method.lower())(url, timeout=30, **kwargs)
            
            if response.headers.get('content-type', '').startswith('application/json'):
                try:
                    response_data = response.json()
                    self.log(f"Response ({response.status_code}): {json.dumps(response_data, indent=2, ensure_ascii=False)}", "DEBUG")
                except json.JSONDecodeError:
                    self.log(f"Response ({response.status_code}): {response.text}", "DEBUG")
            else:
                self.log(f"Response ({response.status_code}): {response.headers.get('content-type', 'unknown')}", "DEBUG")
            
            return response
        except requests.exceptions.RequestException as req_e:
            self.log(f"Request failed: {str(req_e)}", "ERROR")
            # 返回一个模拟的失败响应
            class MockResponse:
                def __init__(self):
                    self.status_code = 0
                    self.text = str(req_e)
                def json(self):
                    return {"error": str(req_e)}
            return MockResponse()
    
    def login(self) -> bool:
        """登录或注册用户"""
        self.log(f"正在登录用户: {self.test_email}")
        
        # 登录接口会自动注册不存在的用户
        response = self._make_request('post', '/api/auth/password/login', json={
            'email': self.test_email,
            'password': self.test_password
        })
        
        if response.status_code in [200, 201]:
            data = response.json()
            # 检查两种可能的响应格式
            if data.get('success') or (data.get('code') == 200 and data.get('data', {}).get('token')):
                token = data.get('data', {}).get('token')
                if token:
                    self.token = token
                    self.log(f"登录成功，获得token: {self.token[:50]}...", "SUCCESS")
                    return True
        
        self.log(f"登录失败: {response.text}", "ERROR")
        return False
    
    def get_user_teams(self) -> bool:
        """获取用户团队列表"""
        self.log("获取用户团队列表")
        
        response = self._make_request('get', '/api/teams')
        
        if response.status_code == 200:
            data = response.json()
            if data.get('success') or (data.get('code') == 200 and 'data' in data):
                teams = data.get('data', [])
                if teams:
                    # 选择第一个团队
                    self.team_id = teams[0]['id']
                    self.log(f"找到 {len(teams)} 个团队，选择团队: {self.team_id} ({teams[0].get('name', 'Unknown')})", "SUCCESS")
                    return True
        
        self.log(f"获取团队失败: {response.text}", "ERROR")
        return False

    # ========== Agent Management Tests ==========
    
    def test_get_available_models(self) -> Dict[str, Any]:
        """测试获取可用模型列表"""
        self.log("测试：获取可用模型列表")
        
        response = self._make_request('get', '/api/agent-v2/available-models')
        
        if response.status_code == 200:
            data = response.json()
            if data.get('success'):
                models_info = data.get('data', {})
                if models_info and models_info.get('models'):
                    self.log_test_result("获取可用模型", True, f"获取到 {len(models_info['models'])} 个可用模型")
                    return models_info
                else:
                    self.log_test_result("获取可用模型", False, "返回数据中缺少models字段")
            else:
                self.log_test_result("获取可用模型", False, "API返回success=false")
        else:
            self.log_test_result("获取可用模型", False, f"HTTP状态码: {response.status_code}", response.text)
        
        return {}
    
    def test_create_agent(self, models_info: Dict[str, Any]) -> Optional[str]:
        """测试创建Agent V2智能体"""
        self.log("测试：创建Agent V2智能体")
        
        if not models_info or not models_info.get('models'):
            self.log_test_result("创建智能体", False, "无可用模型，无法创建智能体")
            return None
            
        # 选择第一个可用模型
        selected_model = models_info['models'][0]
        
        agent_config = {
            'name': f'测试智能体-{uuid.uuid4().hex[:8]}',
            'description': '这是一个用于API测试的智能体',
            'iconUrl': 'https://example.com/icon.png',
            'config': {
                'model': selected_model,
                'temperature': 0.7,
                'maxTokens': 1000,
                'timeout': 30000,
                'reasoningEffort': {
                    'enabled': False,
                    'level': 'medium'
                }
            }
        }
        
        response = self._make_request('post', '/api/agent-v2', json=agent_config)
        
        if response.status_code in [200, 201]:
            data = response.json()
            if data.get('success'):
                agent_id = data.get('data', {}).get('id')
                if agent_id:
                    self.test_agent_id = agent_id
                    self.log_test_result("创建智能体", True, f"智能体创建成功: {agent_id}")
                    return agent_id
                else:
                    self.log_test_result("创建智能体", False, "返回数据中缺少id字段")
            else:
                self.log_test_result("创建智能体", False, f"API返回错误: {data.get('error', 'Unknown error')}")
        else:
            self.log_test_result("创建智能体", False, f"HTTP状态码: {response.status_code}", response.text)
        
        return None
    
    def test_list_agents(self):
        """测试列出智能体"""
        self.log("测试：列出智能体")
        
        response = self._make_request('get', '/api/agent-v2', params={'limit': 5})
        
        if response.status_code == 200:
            data = response.json()
            if data.get('success'):
                agents_data = data.get('data', {})
                agents = agents_data.get('agents', [])
                total = agents_data.get('total', len(agents))
                self.log_test_result("列出智能体", True, f"成功获取 {total} 个智能体，显示前 {len(agents)} 个")
                
                for i, agent in enumerate(agents, 1):
                    self.log(f"  {i}. {agent['name']} ({agent['id']})", "DEBUG")
                    if agent.get('description'):
                        self.log(f"     📝 {agent['description']}", "DEBUG")
            else:
                self.log_test_result("列出智能体", False, f"API返回错误: {data.get('error', 'Unknown error')}")
        else:
            self.log_test_result("列出智能体", False, f"HTTP状态码: {response.status_code}", response.text)
    
    def test_get_agent_details(self, agent_id: str):
        """测试获取智能体详情"""
        if not agent_id:
            self.log_test_result("获取智能体详情", False, "缺少agent_id")
            return
            
        self.log("测试：获取智能体详情")
        
        response = self._make_request('get', f'/api/agent-v2/{agent_id}')
        
        if response.status_code == 200:
            data = response.json()
            if data.get('success'):
                agent = data.get('data', {})
                if agent and agent.get('id') == agent_id:
                    self.log_test_result("获取智能体详情", True, f"成功获取智能体: {agent.get('name', 'Unknown')}")
                else:
                    self.log_test_result("获取智能体详情", False, "返回的智能体数据不完整")
            else:
                self.log_test_result("获取智能体详情", False, f"API返回错误: {data.get('error', 'Unknown error')}")
        else:
            self.log_test_result("获取智能体详情", False, f"HTTP状态码: {response.status_code}", response.text)

    # ========== Session Management Tests ==========
    
    def test_create_streaming_session(self, agent_id: str) -> Optional[str]:
        """测试创建流式会话和消息交互"""
        if not SSE_AVAILABLE:
            self.log_test_result("创建流式会话", False, "sseclient-py未安装，跳过流式测试")
            return None
            
        if not agent_id:
            self.log_test_result("创建流式会话", False, "缺少agent_id")
            return None
            
        self.log("测试：创建流式会话")
        
        # 提供一个实际的初始消息来启动会话
        session_data = {
            'initialMessage': '你好！请告诉我你能帮助我做什么，请保持简短。'
        }
        
        url = f"{self.base_url}/api/agent-v2/{agent_id}/sessions/stream"
        headers = {
            'Authorization': f'Bearer {self.token}',
            'x-monkeys-teamid': self.team_id,
            'Accept': 'text/event-stream',
            'Cache-Control': 'no-cache'
        }
        
        try:
            response = requests.post(url, json=session_data, headers=headers, stream=True, timeout=60)
            
            if response.status_code == 200:
                session_id = self._handle_sse_stream_with_interaction(response, agent_id)
                if session_id:
                    # 如果之前没有创建过普通会话，保存这个会话ID用于后续测试
                    if not self.test_session_id:
                        self.test_session_id = session_id
                    self.log_test_result("创建流式会话", True, f"流式会话完成，会话ID: {session_id}")
                    return session_id
                else:
                    self.log_test_result("创建流式会话", False, "流式处理失败或未获取到会话ID")
            else:
                self.log_test_result("创建流式会话", False, f"HTTP状态码: {response.status_code}", response.text)
                
        except Exception as e:
            self.log_test_result("创建流式会话", False, f"流式连接异常: {str(e)}")
        
        return None
    
    def _handle_sse_stream_with_interaction(self, response: requests.Response, agent_id: str = None) -> Optional[str]:
        """处理SSE流式响应并进行消息交互"""
        # agent_id 参数保留用于向后兼容，但当前实现中不需要使用
        import threading
        
        session_id = None
        message_chunks = []
        event_received = threading.Event()
        conversation_complete = threading.Event()
        followup_questions = []  # 存储收到的followup问题
        
        def sse_listener():
            nonlocal session_id, message_chunks, followup_questions
            try:
                client = sseclient.SSEClient(response)
                
                for event in client.events():
                    if not self.quick_mode:
                        self.log(f"SSE Event: {event.event}", "DEBUG")
                    
                    if event.data:
                        try:
                            data = json.loads(event.data)
                            if not self.quick_mode:
                                self.log(f"Data: {json.dumps(data, ensure_ascii=False)}", "DEBUG")
                            
                            # 处理不同类型的事件
                            if event.event == 'session_metadata':
                                session_id = data.get('sessionId')
                                self.log(f"会话ID: {session_id}", "DEBUG")
                                event_received.set()  # 通知主线程会话已创建
                            
                            elif event.event == 'session_start':
                                self.log("会话已开始，准备发送消息", "DEBUG")
                                event_received.set()
                            
                            elif event.event == 'message' and data.get('type') == 'message_chunk':
                                chunk = data.get('content', '')
                                message_chunks.append(chunk)
                                if not self.quick_mode:
                                    print(chunk, end='', flush=True)
                            
                            elif event.event == 'tool_calls':
                                tool_calls = data.get('toolCalls', [])
                                self.log(f"工具调用: {len(tool_calls)} 个工具", "DEBUG")
                                
                                # 检查是否有ask_followup_question工具调用
                                for tool_call in tool_calls:
                                    if tool_call.get('name') == 'ask_followup_question':
                                        self.log("🤔 检测到 ask_followup_question 工具调用", "DEBUG")
                            
                            elif event.event == 'followup_question':
                                # 处理followup问题事件
                                question = data.get('question', '')
                                suggestions = data.get('suggestions', [])
                                session_id_from_event = data.get('sessionId', '')
                                
                                self.log(f"📋 收到followup问题: {question}", "SUCCESS")
                                if suggestions:
                                    self.log(f"💡 建议选项: {[s['answer'] for s in suggestions]}", "DEBUG")
                                
                                followup_questions.append({
                                    'question': question,
                                    'suggestions': suggestions,
                                    'sessionId': session_id_from_event or session_id
                                })
                                
                                # 自动回答问题
                                self._handle_followup_question(session_id_from_event or session_id, question, suggestions)
                            
                            elif event.event == 'tool_result':
                                tool_info = data.get('tool', {})
                                tool_name = tool_info.get('name', 'unknown')
                                
                                if tool_name == 'ask_followup_question':
                                    self.log("✅ ask_followup_question 工具执行完成", "SUCCESS")
                                elif tool_name == 'update_todo_list':
                                    self.log("✅ update_todo_list 工具执行完成", "SUCCESS")
                                else:
                                    self.log(f"🔧 工具 {tool_name} 执行完成", "DEBUG")
                                
                            elif event.event == 'response_complete':
                                final_message = data.get('message', '')
                                session_id = data.get('sessionId') or session_id
                                self.log("会话响应完成!", "SUCCESS")
                                if not self.quick_mode and final_message:
                                    self.log(f"完整消息: {final_message}", "DEBUG")
                                conversation_complete.set()
                                break
                                
                            elif event.event == 'complete':
                                final_message = data.get('message', '')
                                session_id = data.get('sessionId') or session_id
                                self.log("会话完成!", "SUCCESS")
                                if not self.quick_mode and final_message:
                                    self.log(f"完整消息: {final_message}", "DEBUG")
                                conversation_complete.set()
                                break
                                
                            elif event.event == 'error':
                                error_msg = data.get('error', 'Unknown error')
                                self.log(f"流式错误: {error_msg}", "ERROR")
                                conversation_complete.set()
                                break
                                
                            elif event.event == 'heartbeat':
                                # 心跳事件，继续监听
                                pass
                                
                        except json.JSONDecodeError as e:
                            self.log(f"解析事件数据失败: {e}", "ERROR")
                    
                    # 检查是否应该退出
                    if conversation_complete.is_set():
                        break
                
            except Exception as e:
                self.log(f"处理SSE流异常: {str(e)}", "ERROR")
                conversation_complete.set()
        
        # 启动SSE监听线程
        sse_thread = threading.Thread(target=sse_listener, daemon=True)
        sse_thread.start()
        
        # 等待会话建立
        if event_received.wait(timeout=10):
            self.log("会话建立成功，初始消息已处理", "DEBUG")
            
            # 等待初始对话完成
            if conversation_complete.wait(timeout=30):
                self.log("初始对话交互完成", "SUCCESS")
            else:
                self.log("等待初始对话完成超时，可能仍在处理中", "WARNING")
                
                # 如果初始对话超时，尝试发送额外测试消息
                if session_id:
                    additional_message = '谢谢！还有其他功能吗？'
                    success = self._send_message_to_session(session_id, additional_message)
                    if success:
                        self.log("发送额外测试消息成功", "DEBUG")
                        # 再等待一轮
                        if conversation_complete.wait(timeout=20):
                            self.log("额外消息对话完成", "SUCCESS")
        else:
            self.log("等待会话建立超时", "ERROR")
        
        # 等待SSE线程结束（最多5秒）
        sse_thread.join(timeout=5)
        
        if not self.quick_mode and message_chunks:
            complete_message = ''.join(message_chunks)
            self.log(f"完整拼接消息:\n{complete_message}", "DEBUG")
        
        # 记录收到的followup问题
        if followup_questions:
            self.log(f"本次会话收到 {len(followup_questions)} 个followup问题", "SUCCESS")
        
        return session_id
    
    def _send_message_to_session(self, session_id: str, message: str) -> bool:
        """向会话发送消息的辅助方法"""
        try:
            url = f"{self.base_url}/api/agent-v2/sessions/{session_id}/message"
            headers = {
                'Authorization': f'Bearer {self.token}',
                'x-monkeys-teamid': self.team_id,
                'Content-Type': 'application/json'
            }
            
            message_data = {'message': message}
            
            self.log(f"发送消息到会话 {session_id}: {message[:50]}...", "DEBUG")
            
            response = requests.post(url, json=message_data, headers=headers, timeout=10)
            
            if response.status_code in [200, 201]:
                data = response.json()
                if data.get('success'):
                    return True
                else:
                    self.log(f"发送消息API返回错误: {data.get('error', 'Unknown error')}", "ERROR")
            else:
                self.log(f"发送消息HTTP错误: {response.status_code}", "ERROR")
                
        except Exception as e:
            self.log(f"发送消息异常: {str(e)}", "ERROR")
        
        return False
    
    def _handle_followup_question(self, session_id: str, question: str, suggestions: list) -> bool:
        """处理收到的followup问题"""
        try:
            self.log(f"🤔 处理followup问题: {question[:50]}...", "DEBUG")
            
            # 选择一个合适的回答
            if suggestions and len(suggestions) > 0:
                # 如果有建议选项，选择第一个
                answer = suggestions[0]['answer']
                self.log(f"📝 选择建议答案: {answer}", "DEBUG")
            else:
                # 如果没有建议选项，提供一个通用回答
                answer = "请继续，我想了解更多详情。"
                self.log(f"📝 使用默认答案: {answer}", "DEBUG")
            
            # 调用followup答案提交API
            response = self._make_request('post', f'/api/agent-v2/sessions/{session_id}/followup-answer', 
                                        json={'answer': answer})
            
            if response.status_code in [200, 201]:
                data = response.json()
                if data.get('success'):
                    self.log(f"✅ followup答案提交成功: {answer}", "SUCCESS")
                    return True
                else:
                    self.log(f"❌ followup答案API返回错误: {data.get('error', 'Unknown error')}", "ERROR")
            else:
                self.log(f"❌ followup答案HTTP错误: {response.status_code}", "ERROR")
                
        except Exception as e:
            self.log(f"❌ 处理followup问题异常: {str(e)}", "ERROR")
        
        return False
    
    def test_ask_followup_question_tool(self, agent_id: str) -> bool:
        """专门测试ask_followup_question工具"""
        if not agent_id:
            self.log_test_result("测试ask_followup_question工具", False, "缺少agent_id")
            return False
            
        self.log("🤔 专项测试：ask_followup_question工具")
        
        # 发送一条专门触发ask_followup_question的消息
        session_data = {
            'initialMessage': '你好！我想要实现一个功能但是不确定具体的需求，你能帮我分析一下吗？请使用ask_followup_question工具询问我的具体需求。'
        }
        
        url = f"{self.base_url}/api/agent-v2/{agent_id}/sessions/stream"
        headers = {
            'Authorization': f'Bearer {self.token}',
            'x-monkeys-teamid': self.team_id,
            'Accept': 'text/event-stream',
            'Cache-Control': 'no-cache'
        }
        
        try:
            response = requests.post(url, json=session_data, headers=headers, stream=True, timeout=60)
            
            if response.status_code == 200:
                session_id = self._handle_sse_stream_with_interaction(response, agent_id)
                if session_id:
                    self.log_test_result("测试ask_followup_question工具", True, "ask_followup_question工具测试完成")
                    return True
                else:
                    self.log_test_result("测试ask_followup_question工具", False, "流式处理失败")
            else:
                self.log_test_result("测试ask_followup_question工具", False, f"HTTP状态码: {response.status_code}")
                
        except Exception as e:
            self.log_test_result("测试ask_followup_question工具", False, f"异常: {str(e)}")
        
        return False
    
    def test_update_todo_list_tool(self, agent_id: str) -> bool:
        """专门测试update_todo_list工具"""
        if not agent_id:
            self.log_test_result("测试update_todo_list工具", False, "缺少agent_id")
            return False
            
        self.log("📝 专项测试：update_todo_list工具")
        
        # 发送一条专门触发update_todo_list的消息
        session_data = {
            'initialMessage': '我需要完成几个任务：1. 设计数据库schema 2. 实现API接口 3. 编写测试用例。请帮我用update_todo_list工具创建一个任务清单。'
        }
        
        url = f"{self.base_url}/api/agent-v2/{agent_id}/sessions/stream"
        headers = {
            'Authorization': f'Bearer {self.token}',
            'x-monkeys-teamid': self.team_id,
            'Accept': 'text/event-stream',
            'Cache-Control': 'no-cache'
        }
        
        try:
            response = requests.post(url, json=session_data, headers=headers, stream=True, timeout=60)
            
            if response.status_code == 200:
                session_id = self._handle_sse_stream_with_interaction(response, agent_id)
                if session_id:
                    self.log_test_result("测试update_todo_list工具", True, "update_todo_list工具测试完成")
                    return True
                else:
                    self.log_test_result("测试update_todo_list工具", False, "流式处理失败")
            else:
                self.log_test_result("测试update_todo_list工具", False, f"HTTP状态码: {response.status_code}")
                
        except Exception as e:
            self.log_test_result("测试update_todo_list工具", False, f"异常: {str(e)}")
        
        return False
    
    def _handle_sse_stream(self, response: requests.Response) -> Optional[str]:
        """处理SSE流式响应（旧版本，保留兼容性）"""
        session_id = None
        message_chunks = []
        
        try:
            client = sseclient.SSEClient(response)
            
            for event in client.events():
                if not self.quick_mode:
                    self.log(f"SSE Event: {event.event}", "DEBUG")
                
                if event.data:
                    try:
                        data = json.loads(event.data)
                        if not self.quick_mode:
                            self.log(f"Data: {json.dumps(data, ensure_ascii=False)}", "DEBUG")
                        
                        # 处理不同类型的事件
                        if event.event == 'session_metadata':
                            session_id = data.get('sessionId')
                            self.log(f"会话ID: {session_id}", "DEBUG")
                        
                        elif event.event == 'message' and data.get('type') == 'message_chunk':
                            chunk = data.get('content', '')
                            message_chunks.append(chunk)
                            if not self.quick_mode:
                                print(chunk, end='', flush=True)
                        
                        elif event.event == 'tool_calls':
                            tool_calls = data.get('toolCalls', [])
                            self.log(f"工具调用: {len(tool_calls)} 个工具", "DEBUG")
                            
                        elif event.event == 'complete':
                            final_message = data.get('message', '')
                            session_id = data.get('sessionId') or session_id
                            self.log("会话完成!", "SUCCESS")
                            if not self.quick_mode and final_message:
                                self.log(f"完整消息: {final_message}", "DEBUG")
                            break
                            
                        elif event.event == 'error':
                            error_msg = data.get('error', 'Unknown error')
                            self.log(f"流式错误: {error_msg}", "ERROR")
                            break
                            
                    except json.JSONDecodeError as e:
                        self.log(f"解析事件数据失败: {e}", "ERROR")
                
        except Exception as e:
            self.log(f"处理SSE流异常: {str(e)}", "ERROR")
        
        if not self.quick_mode and message_chunks:
            complete_message = ''.join(message_chunks)
            self.log(f"完整拼接消息:\n{complete_message}", "DEBUG")
        
        return session_id
    
    def test_list_sessions(self, agent_id: str):
        """测试列出会话"""
        if not agent_id:
            self.log_test_result("列出会话", False, "缺少agent_id")
            return
            
        self.log("测试：列出会话")
        
        response = self._make_request('get', f'/api/agent-v2/{agent_id}/sessions', params={'limit': 10})
        
        if response.status_code == 200:
            data = response.json()
            if data.get('success'):
                sessions_data = data.get('data', {})
                sessions = sessions_data.get('sessions', [])
                total = sessions_data.get('total', len(sessions))
                self.log_test_result("列出会话", True, f"成功获取 {total} 个会话，显示前 {len(sessions)} 个")
                
                for i, session in enumerate(sessions, 1):
                    self.log(f"  {i}. {session.get('title', 'Untitled')} ({session['id']})", "DEBUG")
            else:
                self.log_test_result("列出会话", False, f"API返回错误: {data.get('error', 'Unknown error')}")
        else:
            self.log_test_result("列出会话", False, f"HTTP状态码: {response.status_code}", response.text)

    # ========== Message Management Tests ==========
    
    def test_send_message(self, session_id: str):
        """测试发送消息"""
        if not session_id:
            self.log_test_result("发送消息", False, "缺少session_id")
            return
            
        self.log("测试：发送消息")
        
        test_message = '请告诉我当前时间是什么时候？'
        
        success = self._send_message_to_session(session_id, test_message)
        
        if success:
            self.log_test_result("发送消息", True, "消息发送成功")
            # 等待一下让消息处理
            time.sleep(2)
        else:
            self.log_test_result("发送消息", False, "消息发送失败")
    
    def test_get_session_messages(self, session_id: str):
        """测试获取会话消息"""
        if not session_id:
            self.log_test_result("获取会话消息", False, "缺少session_id")
            return
            
        self.log("测试：获取会话消息")
        
        response = self._make_request('get', f'/api/agent-v2/sessions/{session_id}/messages')
        
        if response.status_code == 200:
            data = response.json()
            if data.get('success'):
                messages_data = data.get('data', {})
                messages = messages_data.get('messages', [])
                self.log_test_result("获取会话消息", True, f"获取到 {len(messages)} 条消息")
                
                if not self.quick_mode:
                    for i, msg in enumerate(messages, 1):
                        sender = "用户" if not msg.get('isSystem') else "助手"
                        content = msg['content'][:100] + "..." if len(msg['content']) > 100 else msg['content']
                        self.log(f"  {i}. [{sender}] {content}", "DEBUG")
                        
                        if msg.get('toolCalls'):
                            self.log(f"     🔧 包含工具调用: {len(msg['toolCalls'])} 个", "DEBUG")
            else:
                self.log_test_result("获取会话消息", False, f"API返回错误: {data.get('error', 'Unknown error')}")
        else:
            self.log_test_result("获取会话消息", False, f"HTTP状态码: {response.status_code}", response.text)

    # ========== Session Control Tests ==========
    
    def test_get_session_status(self, session_id: str):
        """测试获取会话状态"""
        if not session_id:
            self.log_test_result("获取会话状态", False, "缺少session_id")
            return
            
        self.log("测试：获取会话状态")
        
        response = self._make_request('get', f'/api/agent-v2/sessions/{session_id}/status')
        
        if response.status_code == 200:
            data = response.json()
            if data.get('success'):
                status_data = data.get('data', {})
                task_status = status_data.get('taskStatus', {})
                queue_info = status_data.get('queueInfo', {})
                is_active = status_data.get('isActive', False)
                
                self.log_test_result("获取会话状态", True, 
                    f"会话状态: {task_status.get('status', 'unknown')}, 活跃: {is_active}")
                
                if not self.quick_mode:
                    self.log(f"队列信息: 等待={queue_info.get('totalQueued', 0)}, "
                            f"处理中={queue_info.get('totalProcessing', 0)}, "
                            f"已完成={queue_info.get('totalProcessed', 0)}", "DEBUG")
            else:
                self.log_test_result("获取会话状态", False, f"API返回错误: {data.get('error', 'Unknown error')}")
        else:
            self.log_test_result("获取会话状态", False, f"HTTP状态码: {response.status_code}", response.text)
    
    def test_resume_session(self, session_id: str):
        """测试恢复会话"""
        if not session_id:
            self.log_test_result("恢复会话", False, "缺少session_id")
            return
            
        self.log("测试：恢复会话")
        
        response = self._make_request('post', f'/api/agent-v2/sessions/{session_id}/resume')
        
        if response.status_code in [200, 201]:
            data = response.json()
            if data.get('success'):
                result = data.get('data', {})
                resumed = result.get('resumed', False)
                message = result.get('message', '')
                queued_messages = result.get('queuedMessages', 0)
                
                self.log_test_result("恢复会话", True, 
                    f"恢复状态: {resumed}, 排队消息: {queued_messages}, 信息: {message}")
            else:
                self.log_test_result("恢复会话", False, f"API返回错误: {data.get('error', 'Unknown error')}")
        else:
            self.log_test_result("恢复会话", False, f"HTTP状态码: {response.status_code}", response.text)
    
    def test_stop_session(self, session_id: str):
        """测试停止会话"""
        if not session_id:
            self.log_test_result("停止会话", False, "缺少session_id")
            return
            
        self.log("测试：停止会话")
        
        response = self._make_request('post', f'/api/agent-v2/sessions/{session_id}/stop')
        
        if response.status_code in [200, 201]:
            data = response.json()
            if data.get('success'):
                result = data.get('data', {})
                message = result.get('message', '')
                self.log_test_result("停止会话", True, f"会话已停止: {message}")
            else:
                self.log_test_result("停止会话", False, f"API返回错误: {data.get('error', 'Unknown error')}")
        else:
            self.log_test_result("停止会话", False, f"HTTP状态码: {response.status_code}", response.text)

    # ========== Context Management Tests ==========
    
    def test_get_context_usage(self, session_id: str):
        """测试获取上下文使用情况"""
        if not session_id:
            self.log_test_result("获取上下文使用情况", False, "缺少session_id")
            return
            
        self.log("测试：获取上下文使用情况")
        
        response = self._make_request('get', f'/api/agent-v2/sessions/{session_id}/context-usage')
        
        if response.status_code == 200:
            data = response.json()
            if data.get('success'):
                usage_data = data.get('data', {})
                message_count = usage_data.get('messageCount', 0)
                estimated_tokens = usage_data.get('estimatedTokens', 0)
                max_tokens = usage_data.get('maxTokens', 0)
                usage_percentage = usage_data.get('usagePercentage', 0)
                
                self.log_test_result("获取上下文使用情况", True, 
                    f"消息数: {message_count}, 预估tokens: {estimated_tokens}, "
                    f"使用率: {usage_percentage}% ({estimated_tokens}/{max_tokens})")
                
                if not self.quick_mode:
                    is_near_limit = usage_data.get('isNearLimit', False)
                    is_over_limit = usage_data.get('isOverLimit', False)
                    can_accept = usage_data.get('canAcceptNewMessages', True)
                    
                    self.log(f"接近限制: {is_near_limit}, 超过限制: {is_over_limit}, "
                            f"可接受新消息: {can_accept}", "DEBUG")
            else:
                self.log_test_result("获取上下文使用情况", False, f"API返回错误: {data.get('error', 'Unknown error')}")
        else:
            self.log_test_result("获取上下文使用情况", False, f"HTTP状态码: {response.status_code}", response.text)

    # ========== Test Orchestration ==========
    
    def run_comprehensive_test(self):
        """运行全面的API测试"""
        self.log("🚀 开始Agent V2 API全面测试")
        self.log("=" * 60)
        
        # 1. 基础认证
        self.log("\n📋 第一阶段：基础认证和设置")
        if not self.login():
            self.log("认证失败，终止测试", "ERROR")
            return False
        
        if not self.get_user_teams():
            self.log("团队设置失败，终止测试", "ERROR")
            return False
        
        # 2. Agent管理测试
        self.log("\n📋 第二阶段：智能体管理")
        models_info = self.test_get_available_models()
        if not models_info:
            self.log("无法获取模型信息，跳过后续依赖测试", "WARNING")
            return False
        
        agent_id = self.test_create_agent(models_info)
        self.test_list_agents()
        if agent_id:
            self.test_get_agent_details(agent_id)
        
        if not agent_id:
            self.log("无法创建智能体，跳过会话相关测试", "WARNING")
            return False
        
        # 3. 会话管理测试
        self.log("\n📋 第三阶段：会话管理")
        
        # 只进行流式会话测试
        session_id = self.test_create_streaming_session(agent_id)
            
        self.test_list_sessions(agent_id)
        
        if not session_id:
            self.log("无法创建会话，跳过消息相关测试", "WARNING")
            return False
        
        # 4. 消息管理测试
        self.log("\n📋 第四阶段：消息管理")
        if not self.quick_mode:
            self.test_send_message(session_id)
            time.sleep(3)  # 等待消息处理
            
        self.test_get_session_messages(session_id)
        
        # 5. 会话控制测试
        self.log("\n📋 第五阶段：会话控制")
        self.test_get_session_status(session_id)
        self.test_resume_session(session_id)
        time.sleep(1)
        self.test_stop_session(session_id)
        
        # 6. 上下文管理测试
        self.log("\n📋 第六阶段：上下文管理")
        self.test_get_context_usage(session_id)
        
        # 7. 工具专项测试
        self.log("\n📋 第七阶段：工具专项测试")
        self.test_ask_followup_question_tool(agent_id)
        time.sleep(2)  # 等待前一个测试完成
        self.test_update_todo_list_tool(agent_id)
        
        return True
    
    def print_test_summary(self):
        """打印测试总结"""
        self.log("=" * 60)
        self.log("🎯 测试结果总结")
        self.log("=" * 60)
        
        total_tests = self.test_results['passed'] + self.test_results['failed'] + self.test_results['skipped']
        self.log(f"总测试数: {total_tests}")
        self.log(f"通过: {self.test_results['passed']}", "SUCCESS")
        self.log(f"失败: {self.test_results['failed']}", "ERROR" if self.test_results['failed'] > 0 else "SUCCESS")
        self.log(f"跳过: {self.test_results['skipped']}", "WARNING" if self.test_results['skipped'] > 0 else "INFO")
        
        if self.test_results['errors']:
            self.log("\n❌ 错误详情:")
            for error in self.test_results['errors']:
                self.log(f"  - {error}", "ERROR")
        
        success_rate = (self.test_results['passed'] / max(total_tests, 1)) * 100
        self.log(f"\n📊 成功率: {success_rate:.1f}%")
        
        if success_rate >= 80:
            self.log("🎉 测试总体结果：良好", "SUCCESS")
        elif success_rate >= 60:
            self.log("⚠️ 测试总体结果：一般", "WARNING")
        else:
            self.log("❌ 测试总体结果：需要改进", "ERROR")


def main():
    """主函数"""
    parser = argparse.ArgumentParser(description='Agent V2 API 综合测试工具')
    parser.add_argument('--base-url', default='http://localhost:80', 
                       help='API基础URL (默认: http://localhost:80)')
    parser.add_argument('--quick', action='store_true', 
                       help='快速模式，跳过详细输出和一些耗时操作')
    
    args = parser.parse_args()
    
    print("Agent V2 API 综合测试工具")
    print("此工具将全面测试所有Agent V2 API端点")
    print(f"基础URL: {args.base_url}")
    print(f"模式: {'快速模式' if args.quick else '完整模式'}")
    print()
    
    # 检查SSE依赖
    if not SSE_AVAILABLE:
        print("⚠️  警告: sseclient-py 未安装，流式测试将被跳过")
        print("   安装命令: pip install sseclient-py")
        print()
    
    # 创建测试器实例
    tester = AgentV2Tester(base_url=args.base_url, quick_mode=args.quick)
    
    try:
        # 运行测试
        success = tester.run_comprehensive_test()
        
        # 打印总结
        tester.print_test_summary()
        
        # 根据测试结果确定退出码
        if success and tester.test_results['failed'] == 0:
            sys.exit(0)
        else:
            sys.exit(1)
        
    except KeyboardInterrupt:
        print("\n⏹️  测试被用户中断")
        tester.print_test_summary()
        sys.exit(1)
    except Exception as e:
        print(f"\n❌ 测试过程中发生异常: {str(e)}")
        import traceback
        traceback.print_exc()
        tester.print_test_summary()
        sys.exit(1)


if __name__ == "__main__":
    main()