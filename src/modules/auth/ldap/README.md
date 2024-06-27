# 本地开发 LDAP 认证

## 安装 LDAP 测试服务

### 使用 Docker 安装 LDAP

运行下面的 docker 命令，ldap 服务端口为 `1389`:

- admin 账号: admin
- admin 密码: custompassword
- root: dc=example,dc=org
- adminDn: cn=admin,dc=example,dc=org

```sh
 docker run -d -p 1389:1389 -p 1636:1636 --name openldap \                                   
  --env LDAP_ADMIN_USERNAME=admin \
  --env LDAP_ADMIN_PASSWORD=adminpassword \
  --env LDAP_ROOT=dc=example,dc=org \
  --env LDAP_ADMIN_DN=cn=admin,dc=example,dc=org \
  bitnami/openldap:latest
```

### 创建一个测试账号

创建一个 `new_user.ldif` 文件，其中 `uid` 为 `newuser`:

```
dn: uid=newuser,dc=example,dc=org
objectClass: inetOrgPerson
objectClass: posixAccount
objectClass: top
cn: New User
sn: User
uid: newuser
uidNumber: 1001
gidNumber: 1001
homeDirectory: /home/newuser
loginShell: /bin/bash
userPassword: {SSHA}dummyPassword
```

使用 ldapadd 创建用户:

```sh
ldapadd -x -H ldap://localhost:1389 -D "cn=admin,dc=example,dc=org" -w adminpassword -f new_user.ldif
```

设置密码为 `adminpassword`:

```sh
ldappasswd -x -H ldap://localhost:1389 -D "cn=admin,dc=example,dc=org" -w adminpassword -s newpassword "uid=newuser,dc=example,dc=org"
```

验证是否成功：

```sh
ldapsearch -x -H ldap://localhost:1389 -D "uid=newuser,dc=example,dc=org" -w newpassword -b "dc=example,dc=org"
```

## 在配置文件中配置 LDAP

```yaml
auth:
  enabled:
    - ldap
  ldap:
    url: ldap://localhost:1389
    bindDN: cn=admin,dc=example,dc=org
    bindCredentials: adminpassword
    baseDN: dc=example,dc=org
    # queryCriteria: '&(objectClass=inetOrgPerson)(uid=%s)'
    queryCriteria: '(uid=%s)'
```

## 测试接口

```sh
curl --location 'http://127.0.0.1:3000/api/auth/ldap/login' \
--header 'Content-Type: application/json' \
--data '{
    "username": "newuser",
    "password": "newpassword"
}'
```