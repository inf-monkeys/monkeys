# Monkeys

## 环境依赖

- node: 18 版本以上

## 配置 OIDC 登录

在配置文件 `config.yaml` 中配置 oidc 认证方式:

```yaml
auth:
  enabled:
    - oidc
  oidc:
    client_id: xxxxx
    client_secret: xxxxx
    issuer: https://xxxxx.authing.cn/oidc
```
