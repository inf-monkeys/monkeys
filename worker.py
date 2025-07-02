#!/usr/bin/env python3
import requests
import time
import json

CONDUCTOR_URL = "http://localhost:8080/api"
TASK_TYPE = "simple_task"
WORKER_ID = "worker1"

def poll_and_execute_task():
    """轮询并执行任务"""
    try:
        # 拉取任务
        poll_url = f"{CONDUCTOR_URL}/tasks/poll/{TASK_TYPE}?workerid={WORKER_ID}"
        print(f"轮询任务: {poll_url}")
        
        resp = requests.get(poll_url, timeout=10)
        
        if resp.status_code == 200:
            try:
                data = resp.json()
            except Exception:
                data = None

            if not data:
                print("没有新任务")
                return

            # 兼容 Conductor 返回单个对象/空字符串/空列表
            if isinstance(data, dict):
                tasks = [data]
            elif isinstance(data, list):
                tasks = data
            else:
                print("未知返回类型:", type(data))
                return

            for task in tasks:
                task_id = task.get("taskId")
                workflow_instance_id = task.get("workflowInstanceId")
                print(f"拿到任务: {task_id}, workflow实例: {workflow_instance_id}")
                
                # 处理任务 - 这里可以添加你的业务逻辑
                output_data = {
                    "result": "任务执行成功",
                    "timestamp": time.time(),
                    "worker_id": WORKER_ID,
                    "message": "Hello from Python worker!",
                    "status": "completed"
                }
                
                # 上报任务完成
                complete_url = f"{CONDUCTOR_URL}/tasks"
                complete_data = {
                    "taskId": task_id,
                    "status": "COMPLETED",
                    "outputData": output_data,
                    "workerId": WORKER_ID,
                    "workflowInstanceId": workflow_instance_id
                }
                
                print(f"上报任务完成: {task_id}")
                print(f"上报数据: {json.dumps(output_data, indent=2)}")
                complete_resp = requests.post(complete_url, json=complete_data, timeout=10)
                
                if complete_resp.status_code == 200:
                    print(f"任务 {task_id} 完成上报成功")
                else:
                    print(f"任务 {task_id} 完成上报失败: {complete_resp.status_code}")
                    print(f"响应: {complete_resp.text}")
        else:
            print(f"轮询失败: {resp.status_code}")
            
    except requests.exceptions.RequestException as e:
        print(f"请求异常: {e}")
    except Exception as e:
        print(f"其他异常: {e}")

def main():
    print(f"启动 Worker - 任务类型: {TASK_TYPE}, Worker ID: {WORKER_ID}")
    print(f"Conductor URL: {CONDUCTOR_URL}")
    print("按 Ctrl+C 停止...")
    
    while True:
        try:
            poll_and_execute_task()
            time.sleep(2)  # 每2秒轮询一次
        except KeyboardInterrupt:
            print("\nWorker 停止")
            break

if __name__ == "__main__":
    main() 