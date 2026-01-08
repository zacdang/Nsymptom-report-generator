# 🚂 Railway 一键部署指南

## 📝 部署步骤（超级简单！）

### 步骤 1：上传代码到 GitHub

1. 访问：https://github.com/new
2. 仓库名称输入：`symptom-report-generator`
3. 选择 **Private**（私有）
4. **不要**勾选任何选项（README、.gitignore等）
5. 点击 "Create repository"

### 步骤 2：上传文件

在创建好的仓库页面：

1. 点击 "uploading an existing file"
2. 把项目文件夹里的**所有文件**拖拽上传
   - ⚠️ **不要上传 `node_modules` 文件夹**
   - ✅ 其他所有文件都要上传
3. 滚动到底部，点击 "Commit changes"

### 步骤 3：在 Railway 部署

1. 访问：https://railway.app
2. 登录你的账号
3. 点击 "New Project"
4. 选择 "Deploy from GitHub repo"
5. 选择你刚创建的 `symptom-report-generator` 仓库
6. Railway 会自动开始构建

### 步骤 4：添加数据库

在 Railway 项目页面：

1. 点击 "+ New" 按钮
2. 选择 "Database"
3. 选择 "Add MySQL"
4. 等待数据库创建完成

### 步骤 5：配置环境变量

1. 点击你的应用服务（symptom-report-generator）
2. 切换到 "Variables" 标签
3. 点击 "Add Variable"，添加以下变量：

```
NODE_ENV=production
```

4. 点击 "Add Reference"，添加数据库连接：
   - 变量名：`DATABASE_URL`
   - 选择：MySQL → `DATABASE_URL`

### 步骤 6：重新部署

1. 切换到 "Deployments" 标签
2. 点击最新的部署
3. 点击右上角的 "..." 菜单
4. 选择 "Redeploy"

### 步骤 7：获取网站地址

1. 切换到 "Settings" 标签
2. 找到 "Networking" 部分
3. 点击 "Generate Domain"
4. 复制生成的域名（类似：`xxx.railway.app`）

---

## ✅ 完成！

访问你的域名，就能看到网站了！

**默认管理员账号：**
- 用户名：`admin`
- 密码：`admin123`

⚠️ **重要：登录后立即修改密码！**

---

## 🆘 遇到问题？

### 构建失败？
- 检查是否上传了所有文件
- 检查 `package.json` 是否存在
- 查看 "Deployments" 的日志

### 网站打不开？
- 确认数据库已添加
- 确认环境变量已配置
- 等待几分钟让服务完全启动

### 数据库连接失败？
- 确认 `DATABASE_URL` 变量已正确配置
- 重新部署一次

---

## 💰 费用

- 免费试用：$5 额度
- 之后：约 $5-10/月
- 可以在 Railway 账户设置中查看用量
