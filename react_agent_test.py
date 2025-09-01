#!/usr/bin/env python3
"""
Monkeys平台ReAct智能体API验证脚本

该脚本测试完整的智能体工作流程：
1. 用户登录认证
2. 获取团队信息
3. 创建ReAct模式的智能体
4. 发送SSE流式请求测试ReAct功能
"""

import json
import logging
import sys
import time
import uuid
from dataclasses import dataclass
from typing import Optional

import requests

# 配置日志
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

@dataclass
class Config:
    """配置类"""
    base_url: str = "http://localhost:3000"
    email: str = "test@example.com"
    password: str = "test123"
    timeout: int = 30
    
class MonkeysAPIClient:
    """Monkeys平台API客户端"""
    
    def __init__(self, config: Config):
        self.config = config
        self.session = requests.Session()
        self.token: Optional[str] = None
        self.user_id: Optional[str] = None
        self.team_id: Optional[str] = None
        self.conversation_app_id: Optional[str] = None
        
        # 设置通用请求头
        self.session.headers.update({
            'Content-Type': 'application/json',
        })
    
    def _request(self, method: str, endpoint: str, **kwargs) -> requests.Response:
        """发送HTTP请求的通用方法"""
        url = f"{self.config.base_url}{endpoint}"
        
        # 添加认证头
        if self.token:
            self.session.headers.update({'Authorization': f'Bearer {self.token}'})
        if self.team_id:
            self.session.headers.update({'x-monkeys-teamid': self.team_id})
            
        kwargs.setdefault('timeout', self.config.timeout)
        
        logger.info(f"[请求] {method.upper()} {url}")
        if kwargs.get('data'):
            logger.debug(f"[请求数据] {kwargs['data']}")
            
        try:
            response = self.session.request(method, url, **kwargs)
            logger.info(f"[响应] {response.status_code}")
            
            if response.headers.get('content-type', '').startswith('application/json'):
                logger.debug(f"[响应数据] {response.text[:500]}...")
                
            return response
        except Exception as e:
            logger.error(f"[请求失败] {e}")
            raise
    
    def login(self) -> bool:
        """用户登录"""
        logger.info("开始用户登录...")
        
        try:
            response = self._request('POST', '/auth/password/login', json={
                'email': self.config.email,
                'password': self.config.password
            })
            
            if response.status_code == 200:
                data = response.json()
                self.token = data['data']['token']
                logger.info("登录成功")
                return True
            else:
                logger.error(f"登录失败: {response.status_code} - {response.text}")
                return False
                
        except Exception as e:
            logger.error(f"登录异常: {e}")
            return False
    
    def get_user_profile(self) -> bool:
        """获取用户信息"""
        logger.info("获取用户信息...")
        
        try:
            response = self._request('GET', '/users/profile')
            
            if response.status_code == 200:
                data = response.json()
                self.user_id = data['data']['id']
                logger.info(f"获取用户信息成功: {data['data']['name']} (ID: {self.user_id})")
                return True
            else:
                logger.error(f"获取用户信息失败: {response.status_code} - {response.text}")
                return False
                
        except Exception as e:
            logger.error(f"获取用户信息异常: {e}")
            return False
    
    def get_teams(self) -> bool:
        """获取用户团队列表"""
        logger.info("获取团队列表...")
        
        try:
            response = self._request('GET', '/teams')
            
            if response.status_code == 200:
                data = response.json()
                teams = data['data']
                if teams:
                    self.team_id = teams[0]['id']  # 使用第一个团队
                    logger.info(f"获取团队列表成功: {teams[0]['name']} (ID: {self.team_id})")
                    return True
                else:
                    logger.error("没有找到团队")
                    return False
            else:
                logger.error(f"获取团队列表失败: {response.status_code} - {response.text}")
                return False
                
        except Exception as e:
            logger.error(f"获取团队列表异常: {e}")
            return False
    
    def create_react_conversation_app(self) -> bool:
        """创建ReAct模式的智能体"""
        logger.info("创建ReAct智能体...")
        
        app_name = f"ReAct测试智能体_{int(time.time())}"
        
        payload = {
            "displayName": app_name,
            "description": "用于测试ReAct模式功能的智能体",
            "iconUrl": "https://example.com/icon.png",
            "model": "gemini-2.5-pro",
            "temperature": 0.7,
            "presence_penalty": 0.5,
            "frequency_penalty": 0.5,
            "mode": "react",
            "maxReActSteps": 15
        }
        
        try:
            response = self._request('POST', '/conversation-apps', json=payload)
            
            if response.status_code == 200:
                data = response.json()
                self.conversation_app_id = data['data']['id']
                logger.info(f"创建ReAct智能体成功: {app_name} (ID: {self.conversation_app_id})")
                return True
            else:
                logger.error(f"创建ReAct智能体失败: {response.status_code} - {response.text}")
                return False
                
        except Exception as e:
            logger.error(f"创建ReAct智能体异常: {e}")
            return False
    
    def test_react_chat_streaming(self, query: str) -> bool:
        """测试ReAct智能体的SSE流式对话"""
        logger.info(f"测试ReAct智能体对话: {query}")
        
        # 生成唯一的会话ID
        conversation_id = str(uuid.uuid4())
        
        payload = {
            "model": self.conversation_app_id,  # 使用智能体ID作为模型
            "messages": [
                {
                    "role": "user", 
                    "content": query
                }
            ],
            "stream": True,  # 启用流式响应
            "max_tokens": 8000,
            "temperature": 0.7
        }
        
        headers = {
            'Authorization': f'Bearer {self.token}',
            'x-monkeys-teamid': self.team_id,
            'x-monkeys-conversation-id': conversation_id,
            'Content-Type': 'application/json',
            'Accept': 'text/event-stream'
        }
        
        url = f"{self.config.base_url}/v1/chat/completions"
        
        try:
            logger.info("开始SSE流式请求...")
            response = requests.post(
                url, 
                json=payload, 
                headers=headers, 
                stream=True,
                timeout=120  # ReAct模式可能需要更长时间
            )
            
            if response.status_code == 200:
                logger.info("SSE连接建立成功")
                
                # 解析SSE事件流
                event_count = 0
                collected_content = ""
                react_steps = []
                
                for line in response.iter_lines(decode_unicode=True):
                    if not line:
                        continue
                        
                    line = line.strip()
                    logger.debug(f"[SSE] {line}")
                    
                    # 解析SSE事件
                    if line.startswith('event: '):
                        event_type = line[7:]
                        logger.info(f"SSE事件: {event_type}")
                        
                    elif line.startswith('data: '):
                        data_str = line[6:]
                        if data_str == '[DONE]':
                            logger.info("SSE流结束")
                            break
                            
                        try:
                            # 尝试解析ReAct步骤事件
                            event_data = json.loads(data_str)
                            
                            # 记录ReAct步骤信息
                            if isinstance(event_data, dict):
                                if 'stepType' in event_data:
                                    step_info = {
                                        'type': event_data.get('type'),
                                        'stepType': event_data.get('stepType'),
                                        'timestamp': event_data.get('timestamp'),
                                        'data': event_data.get('data', {})
                                    }
                                    react_steps.append(step_info)
                                    logger.info(f"ReAct步骤: {step_info['stepType']} - {step_info['data'].get('title', '')}")
                                
                                # OpenAI格式的流式响应
                                elif 'choices' in event_data:
                                    for choice in event_data.get('choices', []):
                                        delta = choice.get('delta', {})
                                        content = delta.get('content')
                                        if content:
                                            collected_content += content
                                            print(content, end='', flush=True)
                                            
                        except json.JSONDecodeError:
                            # 非JSON数据，可能是纯文本内容
                            if data_str and data_str != '[DONE]':
                                collected_content += data_str
                                print(data_str, end='', flush=True)
                    
                    event_count += 1
                    
                    # 防止无限循环
                    if event_count > 1000:
                        logger.warning("事件数量超限，停止接收")
                        break
                
                print()  # 换行
                logger.info("ReAct对话测试完成")
                logger.info("统计信息:")
                logger.info(f"   - 接收事件数: {event_count}")
                logger.info(f"   - ReAct步骤数: {len(react_steps)}")
                logger.info(f"   - 响应内容长度: {len(collected_content)}")
                
                if react_steps:
                    logger.info("ReAct执行步骤:")
                    for i, step in enumerate(react_steps, 1):
                        title = step['data'].get('title', step['stepType'])
                        logger.info(f"   {i}. {step['stepType']}: {title}")
                
                return True
                
            else:
                logger.error(f"SSE请求失败: {response.status_code} - {response.text}")
                return False
                
        except Exception as e:
            logger.error(f"ReAct对话测试异常: {e}")
            return False
    
    def test_react_non_streaming(self, query: str) -> bool:
        """测试ReAct智能体的非流式对话"""
        logger.info(f"测试ReAct智能体非流式对话: {query}")
        
        conversation_id = str(uuid.uuid4())
        
        payload = {
            "model": self.conversation_app_id,
            "messages": [
                {
                    "role": "user", 
                    "content": query
                }
            ],
            "stream": False,  # 非流式
            "max_tokens": 8000,
            "temperature": 0.7
        }
        
        headers = {
            'Authorization': f'Bearer {self.token}',
            'x-monkeys-teamid': self.team_id,
            'x-monkeys-conversation-id': conversation_id,
            'Content-Type': 'application/json'
        }
        
        url = f"{self.config.base_url}/v1/chat/completions"
        
        try:
            response = requests.post(
                url, 
                json=payload, 
                headers=headers,
                timeout=120
            )
            
            if response.status_code == 200:
                data = response.json()
                content = data.get('choices', [{}])[0].get('message', {}).get('content', '')
                logger.info("非流式ReAct对话成功")
                logger.info(f"响应内容: {content[:200]}...")
                return True
            else:
                logger.error(f"非流式ReAct对话失败: {response.status_code} - {response.text}")
                return False
                
        except Exception as e:
            logger.error(f"非流式ReAct对话异常: {e}")
            return False
    
    def cleanup(self):
        """清理资源"""
        if self.conversation_app_id:
            logger.info("清理测试智能体...")
            try:
                response = self._request('DELETE', f'/conversation-apps/{self.conversation_app_id}')
                if response.status_code == 200:
                    logger.info("智能体清理完成")
                else:
                    logger.warning(f"智能体清理失败: {response.status_code}")
            except Exception as e:
                logger.warning(f"智能体清理异常: {e}")

def main():
    """主函数"""
    # 加载配置
    config = Config()
    client = MonkeysAPIClient(config)
    
    success_steps = 0
    total_steps = 7
    
    try:
        # 步骤1: 用户登录
        print(f"\n步骤 1/{total_steps}: 用户登录")
        if client.login():
            success_steps += 1
        else:
            logger.error("登录失败，终止测试")
            return False
        
        # 步骤2: 获取用户信息
        print(f"\n步骤 2/{total_steps}: 获取用户信息")
        if client.get_user_profile():
            success_steps += 1
        else:
            logger.error("获取用户信息失败，终止测试")
            return False
        
        # 步骤3: 获取团队信息
        print(f"\n步骤 3/{total_steps}: 获取团队信息")
        if client.get_teams():
            success_steps += 1
        else:
            logger.error("获取团队信息失败，终止测试")
            return False
        
        # 步骤4: 创建ReAct智能体
        print(f"\n步骤 4/{total_steps}: 创建ReAct智能体")
        if client.create_react_conversation_app():
            success_steps += 1
        else:
            logger.error("创建ReAct智能体失败，终止测试")
            return False
        
        # 步骤5: 测试ReAct流式对话
        print(f"\n步骤 5/{total_steps}: 测试ReAct流式对话")
        test_query = "请帮我制定一个学习Python的计划，包括基础语法、数据结构、Web开发等内容。请详细规划每个阶段的学习目标和时间安排。"
        if client.test_react_chat_streaming(test_query):
            success_steps += 1
        
        # 步骤6: 测试ReAct非流式对话
        print(f"\n步骤 6/{total_steps}: 测试ReAct非流式对话")
        test_query_2 = "总结一下刚才制定的学习计划的要点。"
        if client.test_react_non_streaming(test_query_2):
            success_steps += 1
        
        # 步骤7: 清理资源
        print(f"\n步骤 7/{total_steps}: 清理测试资源")
        client.cleanup()
        success_steps += 1
        
    except KeyboardInterrupt:
        logger.info("\n用户中断测试")
        client.cleanup()
        return False
    except Exception as e:
        logger.error(f"测试过程中发生异常: {e}")
        client.cleanup()
        return False
    
    # 输出测试结果
    print("\n" + "=" * 60)
    print("测试结果汇总")
    print("=" * 60)
    print(f"成功步骤: {success_steps}/{total_steps}")
    print(f"成功率: {success_steps/total_steps*100:.1f}%")
    
    if success_steps == total_steps:
        print("所有测试通过！ReAct智能体API功能正常")
        return True
    else:
        print("部分测试失败，请检查API配置和服务状态")
        return False

if __name__ == "__main__":
    if len(sys.argv) > 1:
        Config.base_url = sys.argv[1]
    if len(sys.argv) > 2:
        Config.email = sys.argv[2] 
    if len(sys.argv) > 3:
        Config.password = sys.argv[3]
    
    print("配置信息:")
    print(f"   - 服务器地址: {Config.base_url}")
    print(f"   - 测试邮箱: {Config.email}")
    print(f"   - 请确保服务器正在运行且配置正确")
    
    success = main()
    sys.exit(0 if success else 1)