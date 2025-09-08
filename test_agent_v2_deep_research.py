#!/usr/bin/env python3
"""
测试 AgentV2 的 Deep Research 功能
专注测试深度研究工作流，完整记录 SSE 数据流

保存完整的 SSE 输出到 JSON 文件，方便前端分析数据结构
"""

import os
import json
import time
import uuid
import requests
from typing import Dict, List, Optional
from dataclasses import dataclass

# 配置
API_BASE_URL = os.getenv('AGENT_V2_API_URL', 'http://localhost:80')

@dataclass
class TestResult:
    test_name: str
    success: bool
    execution_time: float
    agent_id: Optional[str] = None
    session_id: Optional[str] = None
    messages: List[Dict] = None
    tools_used: List[str] = None
    error: Optional[str] = None

class AgentV2DeepResearchTester:
    def __init__(self):
        self.session = requests.Session()
        self.session.headers.update({'Content-Type': 'application/json'})
        self.results: List[TestResult] = []
        
        # 认证信息
        self.token: Optional[str] = None
        self.user_id: Optional[str] = None
        self.team_id: Optional[str] = None
        
        # 测试用户信息
        self.test_email = f"test-deep-research-{uuid.uuid4().hex[:8]}@example.com"
        self.test_password = "TestPass123"
    
    def _make_request(self, method: str, endpoint: str, **kwargs) -> requests.Response:
        """发送HTTP请求的通用方法"""
        url = f"{API_BASE_URL}{endpoint}"
        headers = kwargs.get('headers', {})
        
        if self.token:
            headers['Authorization'] = f'Bearer {self.token}'
        if self.team_id:
            headers['x-monkeys-teamid'] = self.team_id
            
        kwargs['headers'] = headers
        
        # 设置默认超时，如果没有提供的话
        if 'timeout' not in kwargs:
            kwargs['timeout'] = 30
        
        try:
            response = getattr(self.session, method.lower())(url, **kwargs)
            return response
        except requests.exceptions.RequestException as req_error:
            print(f"❌ Request failed: {str(req_error)}")
            # 返回一个模拟的失败响应
            class MockResponse:
                def __init__(self, error_msg):
                    self.status_code = 0
                    self.text = error_msg
                def json(self):
                    return {"error": self.text}
            return MockResponse(str(req_error))
    
    def login(self) -> bool:
        """登录或注册用户"""
        print(f"🔐 正在登录用户: {self.test_email}")
        
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
                    print(f"✅ 登录成功，获得token: {self.token[:50]}...")
                    return True
        
        print(f"❌ 登录失败: {response.text}")
        return False
    
    def get_user_teams(self) -> bool:
        """获取用户团队列表"""
        print("👥 获取用户团队列表")
        
        response = self._make_request('get', '/api/teams')
        
        if response.status_code == 200:
            data = response.json()
            if data.get('success') or (data.get('code') == 200 and 'data' in data):
                teams = data.get('data', [])
                if teams:
                    # 选择第一个团队
                    self.team_id = teams[0]['id']
                    print(f"✅ 找到 {len(teams)} 个团队，选择团队: {self.team_id} ({teams[0].get('name', 'Unknown')})")
                    return True
        
        print(f"❌ 获取团队失败: {response.text}")
        return False

    def get_available_models(self) -> Dict:
        """获取可用模型列表"""
        print("📋 获取可用模型列表...")
        
        response = self._make_request('get', '/api/agent-v2/available-models')
        
        if response.status_code == 200:
            data = response.json()
            if data.get('success'):
                models_info = data.get('data', {})
                if models_info and models_info.get('models'):
                    print(f"✅ 获取到 {len(models_info['models'])} 个可用模型")
                    return models_info
        
        print(f"❌ 获取模型失败: {response.text}")
        return {}
    
    def create_test_agent(self) -> str:
        """创建用于测试的智能体"""
        print("🤖 创建Deep Research测试智能体...")
        
        # 获取可用模型
        models_info = self.get_available_models()
        if not models_info or not models_info.get('models'):
            raise Exception("无法获取可用模型列表")
            
        # 选择第一个可用模型
        selected_model = models_info['models'][0]
        
        payload = {
            'name': f'Deep Research Agent-{uuid.uuid4().hex[:8]}',
            'description': 'An agent specialized in conducting deep research using web search and todo list management',
            'iconUrl': 'https://example.com/research-icon.png',
            'config': {
                'model': selected_model,
                'temperature': 0.3,
                'maxTokens': 4096,
                'timeout': 60000,
                'reasoningEffort': {
                    'enabled': False,
                    'level': 'medium'
                }
            }
        }
        
        response = self._make_request('post', '/api/agent-v2', json=payload)
        
        if response.status_code in [200, 201]:
            data = response.json()
            if data.get('success'):
                agent_id = data.get('data', {}).get('id')
                if agent_id:
                    print(f"✅ 智能体创建成功: {agent_id}")
                    return agent_id
                else:
                    raise Exception("返回数据中缺少id字段")
            else:
                raise Exception(f"API返回错误: {data.get('error', 'Unknown error')}")
        else:
            raise Exception(f"HTTP状态码: {response.status_code}, {response.text}")
    
    def test_deep_research_workflow(self, agent_id: str) -> TestResult:
        """测试完整的深度研究工作流"""
        start_time = time.time()
        test_name = "Deep Research Workflow"
        
        # 深度研究任务：分析当前AI发展趋势
        research_query = """
        请进行一个关于"2025年人工智能发展趋势"的深度研究。
        
        要求：
        1. 分析最新的AI技术发展动态
        2. 研究主要科技公司的AI战略
        3. 总结AI在不同行业的应用现状
        4. 预测未来6个月的重要发展方向
        5. 生成一份综合研究报告
        
        请使用系统化的方法，创建研究计划并逐步执行。
        """
        
        try:
            # 启动流式会话
            payload = {"initialMessage": research_query}
            response = self._make_request(
                'post',
                f'/api/agent-v2/{agent_id}/sessions/stream',
                json=payload,
                stream=True,
                timeout=300  # 5分钟超时
            )
            
            if response.status_code != 200:
                return TestResult(
                    test_name=test_name,
                    success=False,
                    execution_time=time.time() - start_time,
                    error=f"Failed to start session: {response.text}"
                )
            
            # 解析SSE流并保存完整数据
            events = []
            raw_sse_data = []  # 保存原始SSE数据
            messages = []
            tools_used = set()
            session_id = None
            line_count = 0
            
            print("🔍 开始解析SSE流...")
            
            for line in response.iter_lines(decode_unicode=True):
                line_count += 1
                if line_count % 10 == 0:  # 每10行打印一次进度
                    print(f"📡 已处理 {line_count} 行SSE数据")
                
                # 保存原始SSE行数据
                raw_sse_data.append({
                    'line_number': line_count,
                    'raw_line': line,
                    'timestamp': time.time()
                })
                
                if not line:
                    continue
                    
                if not line.startswith('data: '):
                    print(f"🔸 非数据行: {line[:100]}...")
                    continue
                    
                try:
                    data_content = line[6:]  # 移除 'data: ' 前缀
                    if data_content.strip() == '[DONE]':
                        print("✅ 收到结束标记 [DONE]")
                        break
                        
                    data = json.loads(data_content)
                    events.append(data)
                    
                    # 记录不同类型的事件
                    event_type = data.get('type', 'unknown')
                    print(f"📨 收到事件: {event_type}")
                    
                    if event_type == 'session_metadata':
                        session_id = data.get('sessionId')
                        print(f"🆔 会话ID: {session_id}")
                        
                    elif event_type == 'tool_calls':
                        tool_calls = data.get('toolCalls', [])
                        for tool_call in tool_calls:
                            tool_name = tool_call.get('name', 'unknown')
                            tools_used.add(tool_name)
                            print(f"🛠️ 工具调用: {tool_name}")
                            if 'arguments' in tool_call:
                                args_preview = str(tool_call['arguments'])[:100]
                                print(f"   参数预览: {args_preview}...")
                            
                    elif event_type == 'tool_result':
                        result = data.get('result', {})
                        output_preview = str(result.get('output', ''))[:200]
                        print(f"🔧 工具结果: {output_preview}...")
                        
                    elif event_type == 'message_chunk':
                        # 收集消息内容
                        content = data.get('content', '')
                        if content:
                            messages.append(content)
                            print(f"💬 消息片段: {content[:50]}...")
                            
                    elif event_type == 'response_complete':
                        print("✅ 响应完成")
                        break
                    
                    elif event_type == 'error':
                        error_msg = data.get('error', 'Unknown error')
                        print(f"❌ 收到错误: {error_msg}")
                        
                except json.JSONDecodeError as e:
                    print(f"⚠️ JSON解析失败: {e}, 内容: {line[:100]}...")
                    continue
            
            print(f"📊 SSE流解析完成，共处理 {line_count} 行，收到 {len(events)} 个事件")
            
            # 保存完整的SSE数据到文件
            sse_output_file = f"sse_output_{int(time.time())}.json"
            sse_complete_data = {
                'test_info': {
                    'test_name': test_name,
                    'agent_id': agent_id,
                    'session_id': session_id,
                    'start_time': start_time,
                    'research_query': research_query.strip()
                },
                'raw_sse_lines': raw_sse_data,
                'parsed_events': events,
                'summary': {
                    'total_lines': line_count,
                    'total_events': len(events),
                    'tools_used': list(tools_used),
                    'execution_time': time.time() - start_time
                }
            }
            
            try:
                with open(sse_output_file, 'w', encoding='utf-8') as f:
                    json.dump(sse_complete_data, f, indent=2, ensure_ascii=False, default=str)
                print(f"💾 完整SSE数据已保存到: {sse_output_file}")
            except Exception as e:
                print(f"⚠️ 保存SSE数据失败: {e}")
                    
            execution_time = time.time() - start_time
            
            # 验证深度研究工作流
            expected_tools = {'update_todo_list', 'web_search', 'attempt_completion'}
            tools_used_list = list(tools_used)
            
            # 检查是否使用了预期的工具
            workflow_valid = expected_tools.issubset(tools_used)
            
            # 检查是否有多次搜索（深度研究特征）
            search_events = [e for e in events if e.get('type') == 'tool_calls' 
                           and any(tc.get('name') == 'web_search' 
                                 for tc in e.get('toolCalls', []))]
            multiple_searches = len(search_events) >= 2
            
            # 检查是否有结构化的研究过程
            todo_events = [e for e in events if e.get('type') == 'tool_calls' 
                         and any(tc.get('name') == 'update_todo_list' 
                               for tc in e.get('toolCalls', []))]
            structured_approach = len(todo_events) >= 1
            
            success = workflow_valid and multiple_searches and structured_approach
            
            return TestResult(
                test_name=test_name,
                success=success,
                execution_time=execution_time,
                agent_id=agent_id,
                session_id=session_id,
                messages=messages,
                tools_used=tools_used_list,
                error=None if success else "Workflow validation failed"
            )
            
        except Exception as e:
            return TestResult(
                test_name=test_name,
                success=False,
                execution_time=time.time() - start_time,
                error=str(e)
            )
    
    
    def run_all_tests(self):
        """运行所有测试"""
        print("🚀 开始 AgentV2 Deep Research 功能测试")
        print("=" * 60)
        
        try:
            # 登录
            if not self.login():
                raise Exception("用户登录失败")
            
            # 获取团队
            if not self.get_user_teams():
                raise Exception("获取团队信息失败")
                
            # 创建测试智能体
            agent_id = self.create_test_agent()
            
            # 只运行深度研究工作流测试
            print("\n🧪 执行深度研究工作流测试")
            result = self.test_deep_research_workflow(agent_id)
            self.results.append(result)
            
            if result.success:
                print(f"✅ {result.test_name} - 成功 ({result.execution_time:.2f}s)")
            else:
                print(f"❌ {result.test_name} - 失败: {result.error}")
            
            # 生成测试报告
            self.generate_report()
            
        except Exception as e:
            print(f"❌ 测试执行失败: {str(e)}")
    
    def generate_report(self):
        """生成测试报告"""
        print("\n" + "=" * 60)
        print("📊 Deep Research 功能测试报告")
        print("=" * 60)
        
        successful_tests = [r for r in self.results if r.success]
        failed_tests = [r for r in self.results if not r.success]
        
        print(f"✅ 成功测试: {len(successful_tests)}/{len(self.results)}")
        print(f"❌ 失败测试: {len(failed_tests)}")
        
        if successful_tests:
            avg_time = sum(r.execution_time for r in successful_tests) / len(successful_tests)
            print(f"⏱️  平均执行时间: {avg_time:.2f}秒")
        
        # 详细结果
        print("\n📋 测试详情:")
        for result in self.results:
            status = "✅" if result.success else "❌"
            print(f"  {status} {result.test_name}")
            print(f"    执行时间: {result.execution_time:.2f}s")
            
            if result.tools_used:
                print(f"    使用工具: {', '.join(result.tools_used)}")
            
            if result.session_id:
                print(f"    会话ID: {result.session_id}")
                
            if not result.success and result.error:
                print(f"    错误信息: {result.error}")
            print()
        
        # 保存结果到文件
        report_data = {
            'test_summary': {
                'total_tests': len(self.results),
                'successful_tests': len(successful_tests),
                'failed_tests': len(failed_tests),
                'average_execution_time': sum(r.execution_time for r in successful_tests) / len(successful_tests) if successful_tests else 0
            },
            'detailed_results': []
        }
        
        for result in self.results:
            report_data['detailed_results'].append({
                'test_name': result.test_name,
                'success': result.success,
                'execution_time': result.execution_time,
                'agent_id': result.agent_id,
                'session_id': result.session_id,
                'tools_used': result.tools_used,
                'error': result.error
            })
        
        with open('agent_v2_deep_research_test_results.json', 'w', encoding='utf-8') as f:
            json.dump(report_data, f, indent=2, ensure_ascii=False, default=str)
        
        print("💾 详细测试结果已保存到: agent_v2_deep_research_test_results.json")
        
        # 分析和建议
        self.generate_recommendations()
    
    def generate_recommendations(self):
        """生成改进建议"""
        print("\n💡 功能分析和建议:")
        
        # 分析工具使用模式
        all_tools_used = set()
        for result in self.results:
            if result.tools_used:
                all_tools_used.update(result.tools_used)
        
        if 'web_search' in all_tools_used and 'update_todo_list' in all_tools_used:
            print("  ✅ Deep Research 工具链集成正常")
        else:
            print("  ⚠️ 工具链集成需要优化")
        
        # 性能分析
        successful_results = [r for r in self.results if r.success]
        if successful_results:
            max_time = max(r.execution_time for r in successful_results)
            if max_time > 120:  # 2分钟
                print("  ⚠️ 某些测试执行时间较长，考虑优化搜索超时设置")
            else:
                print("  ✅ 执行性能良好")
        
        # 成功率分析
        success_rate = len([r for r in self.results if r.success]) / len(self.results) * 100
        if success_rate >= 80:
            print(f"  ✅ 整体成功率良好: {success_rate:.1f}%")
        else:
            print(f"  ⚠️ 成功率需要改进: {success_rate:.1f}%")
        
        print("\n🎉 AgentV2 Deep Research 功能测试完成!")

def main():
    """主函数"""
    print("💡 AgentV2 Deep Research 功能测试")
    print("专注测试深度研究工作流，完整记录 SSE 数据流")
    print("输出 JSON 文件用于前端数据结构分析")
    
    tester = AgentV2DeepResearchTester()
    tester.run_all_tests()

if __name__ == "__main__":
    main()