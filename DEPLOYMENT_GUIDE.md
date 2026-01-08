# Symptom Report Generator - Deployment Guide

**Version:** 1.0  
**Last Updated:** December 2025  
**Author:** Manus AI

---

## Overview

This guide provides step-by-step instructions for deploying the Symptom Report Generator application to a cloud server in China (Aliyun or Tencent Cloud). The application is a full-stack web application built with React, Express, tRPC, and MySQL, designed for managing employee-generated symptom reports with PDF export capabilities.

---

## System Requirements

### Server Specifications

The application requires a Linux server with the following minimum specifications:

| Component | Minimum | Recommended |
|-----------|---------|-------------|
| CPU | 1 Core | 2 Cores |
| RAM | 2 GB | 4 GB |
| Storage | 20 GB | 40 GB |
| OS | Ubuntu 20.04+ | Ubuntu 22.04 LTS |
| Network | 1 Mbps | 5 Mbps |

### Software Dependencies

The server must have the following software installed:

- **Node.js** 22.x or higher
- **pnpm** 10.x or higher
- **MySQL** 8.0 or higher (or TiDB compatible database)
- **Python** 3.8+ (for WeasyPrint PDF generation)
- **WeasyPrint** (Python package for PDF generation)
- **Nginx** (optional, for reverse proxy)
- **PM2** (for process management)

---

## Pre-Deployment Checklist

Before starting the deployment process, ensure you have:

- [ ] Rented a cloud server from Aliyun or Tencent Cloud
- [ ] Obtained server SSH access credentials (IP address, username, password/key)
- [ ] Configured security group rules to allow HTTP (port 80) and HTTPS (port 443) traffic
- [ ] (Optional) Registered a domain name and configured DNS to point to your server IP
- [ ] Prepared a MySQL database instance (can be on the same server or a managed database service)

---

## Step 1: Server Initial Setup

### 1.1 Connect to Your Server

Connect to your server via SSH:

```bash
ssh root@YOUR_SERVER_IP
```

Replace `YOUR_SERVER_IP` with your actual server IP address.

### 1.2 Update System Packages

Update the system package list and upgrade installed packages:

```bash
apt update && apt upgrade -y
```

### 1.3 Create Application User

Create a dedicated user for running the application (recommended for security):

```bash
adduser appuser
usermod -aG sudo appuser
su - appuser
```

---

## Step 2: Install Node.js and pnpm

### 2.1 Install Node.js 22.x

Install Node.js using the NodeSource repository:

```bash
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt install -y nodejs
```

Verify the installation:

```bash
node --version  # Should show v22.x.x
npm --version
```

### 2.2 Install pnpm

Install pnpm globally:

```bash
sudo npm install -g pnpm
pnpm --version  # Should show 10.x.x
```

---

## Step 3: Install and Configure MySQL

### 3.1 Install MySQL Server

Install MySQL 8.0:

```bash
sudo apt install -y mysql-server
```

### 3.2 Secure MySQL Installation

Run the security script:

```bash
sudo mysql_secure_installation
```

Follow the prompts to:
- Set a strong root password
- Remove anonymous users
- Disallow root login remotely
- Remove test database
- Reload privilege tables

### 3.3 Create Application Database

Log into MySQL:

```bash
sudo mysql -u root -p
```

Create the database and user:

```sql
CREATE DATABASE symptom_reports CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'appuser'@'localhost' IDENTIFIED BY 'YOUR_STRONG_PASSWORD';
GRANT ALL PRIVILEGES ON symptom_reports.* TO 'appuser'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

**Important:** Replace `YOUR_STRONG_PASSWORD` with a strong password and save it securely.

---

## Step 4: Install Python and WeasyPrint

### 4.1 Install Python 3 and pip

```bash
sudo apt install -y python3 python3-pip python3-dev
```

### 4.2 Install WeasyPrint Dependencies

WeasyPrint requires several system libraries:

```bash
sudo apt install -y \
    libpango-1.0-0 \
    libpangoft2-1.0-0 \
    libharfbuzz0b \
    libffi-dev \
    libjpeg-dev \
    libopenjp2-7-dev \
    libcairo2 \
    libgdk-pixbuf2.0-0 \
    shared-mime-info
```

### 4.3 Install WeasyPrint

Install WeasyPrint using pip:

```bash
sudo pip3 install weasyprint
```

Verify the installation:

```bash
weasyprint --version
```

### 4.4 Install Chinese Fonts

For proper Chinese character rendering in PDFs:

```bash
sudo apt install -y fonts-noto-cjk fonts-wqy-zenhei fonts-wqy-microhei
```

---

## Step 5: Deploy the Application

### 5.1 Upload Application Files

From your local machine, upload the application files to the server using `scp` or `rsync`:

```bash
# Option 1: Using scp
scp -r /path/to/symptom-report-generator appuser@YOUR_SERVER_IP:/home/appuser/

# Option 2: Using rsync (recommended)
rsync -avz --exclude 'node_modules' --exclude '.git' \
    /path/to/symptom-report-generator \
    appuser@YOUR_SERVER_IP:/home/appuser/
```

Alternatively, you can use Git to clone the repository directly on the server (if you have version control set up).

### 5.2 Install Dependencies

SSH into the server and navigate to the application directory:

```bash
cd /home/appuser/symptom-report-generator
pnpm install
```

### 5.3 Configure Environment Variables

Create a `.env` file in the project root:

```bash
nano .env
```

Add the following configuration:

```env
# Database Configuration
DATABASE_URL=mysql://appuser:YOUR_STRONG_PASSWORD@localhost:3306/symptom_reports

# JWT Secret (generate a random string)
JWT_SECRET=your-super-secret-jwt-key-change-this

# Server Configuration
PORT=3000
NODE_ENV=production

# Manus OAuth (if using Manus authentication)
VITE_APP_ID=your-app-id
OAUTH_SERVER_URL=https://api.manus.im
VITE_OAUTH_PORTAL_URL=https://portal.manus.im
OWNER_OPEN_ID=your-owner-open-id
OWNER_NAME=Your Name
```

**Important:** 
- Replace `YOUR_STRONG_PASSWORD` with your MySQL password
- Generate a strong random string for `JWT_SECRET` (use: `openssl rand -base64 32`)
- Update Manus OAuth credentials if applicable

### 5.4 Push Database Schema

Run the database migration:

```bash
pnpm db:push
```

This will create all necessary tables in the MySQL database.

### 5.5 Build the Application

Build the production version:

```bash
pnpm build
```

---

## Step 6: Install and Configure PM2

### 6.1 Install PM2

Install PM2 globally:

```bash
sudo npm install -g pm2
```

### 6.2 Start the Application with PM2

Create a PM2 ecosystem file:

```bash
nano ecosystem.config.js
```

Add the following configuration:

```javascript
module.exports = {
  apps: [{
    name: 'symptom-report-generator',
    script: 'dist/index.js',
    cwd: '/home/appuser/symptom-report-generator',
    instances: 1,
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    error_file: 'logs/err.log',
    out_file: 'logs/out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    merge_logs: true,
    autorestart: true,
    max_restarts: 10,
    min_uptime: '10s'
  }]
};
```

Start the application:

```bash
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

Follow the instructions from `pm2 startup` to enable PM2 to start on system boot.

### 6.3 Verify Application is Running

Check the application status:

```bash
pm2 status
pm2 logs symptom-report-generator
```

Test the application:

```bash
curl http://localhost:3000
```

---

## Step 7: Configure Nginx (Optional but Recommended)

### 7.1 Install Nginx

```bash
sudo apt install -y nginx
```

### 7.2 Create Nginx Configuration

Create a new Nginx site configuration:

```bash
sudo nano /etc/nginx/sites-available/symptom-report-generator
```

Add the following configuration:

```nginx
server {
    listen 80;
    server_name YOUR_DOMAIN_OR_IP;

    client_max_body_size 50M;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 300s;
        proxy_connect_timeout 75s;
    }
}
```

Replace `YOUR_DOMAIN_OR_IP` with your domain name or server IP.

### 7.3 Enable the Site

```bash
sudo ln -s /etc/nginx/sites-available/symptom-report-generator /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### 7.4 Configure Firewall

Allow HTTP and HTTPS traffic:

```bash
sudo ufw allow 'Nginx Full'
sudo ufw enable
```

---

## Step 8: SSL Certificate (Optional but Recommended)

### 8.1 Install Certbot

```bash
sudo apt install -y certbot python3-certbot-nginx
```

### 8.2 Obtain SSL Certificate

```bash
sudo certbot --nginx -d YOUR_DOMAIN
```

Follow the prompts to complete the SSL certificate installation.

### 8.3 Auto-Renewal

Certbot automatically sets up a cron job for certificate renewal. Verify it:

```bash
sudo systemctl status certbot.timer
```

---

## Step 9: Create Initial Admin Account

SSH into the server and run the admin creation script:

```bash
cd /home/appuser/symptom-report-generator
pnpm exec tsx scripts/create-admin.ts
```

This will create an admin account with:
- Username: `admin`
- Password: `admin123`

**Important:** Change the admin password immediately after first login!

---

## Step 10: Post-Deployment Verification

### 10.1 Access the Application

Open your browser and navigate to:
- **With domain:** `https://YOUR_DOMAIN`
- **With IP:** `http://YOUR_SERVER_IP`

### 10.2 Test Core Features

1. Login as admin (username: `admin`, password: `admin123`)
2. Add a test symptom in the Symptoms tab
3. Create a test employee account
4. Logout and login as the employee
5. Create a test report
6. Try downloading the report as PDF

### 10.3 Monitor Application Logs

```bash
pm2 logs symptom-report-generator
```

---

## Maintenance and Updates

### Update Application Code

To update the application with new code:

```bash
cd /home/appuser/symptom-report-generator
git pull  # If using Git
pnpm install
pnpm build
pm2 restart symptom-report-generator
```

### Backup Database

Create regular database backups:

```bash
mysqldump -u appuser -p symptom_reports > backup_$(date +%Y%m%d).sql
```

### Monitor Server Resources

```bash
pm2 monit
htop
df -h
```

---

## Troubleshooting

### Application Won't Start

Check PM2 logs:
```bash
pm2 logs symptom-report-generator --lines 100
```

Common issues:
- Database connection failed: Check `.env` file and MySQL credentials
- Port already in use: Change PORT in `.env` or stop conflicting service
- Permission errors: Ensure files are owned by `appuser`

### PDF Generation Fails

Verify WeasyPrint installation:
```bash
weasyprint --version
```

Check Chinese fonts:
```bash
fc-list :lang=zh
```

### Database Connection Issues

Test MySQL connection:
```bash
mysql -u appuser -p symptom_reports
```

Check MySQL service status:
```bash
sudo systemctl status mysql
```

---

## Security Recommendations

1. **Change Default Passwords:** Immediately change the default admin password after first login
2. **Use Strong Passwords:** Use passwords with at least 16 characters including uppercase, lowercase, numbers, and symbols
3. **Enable Firewall:** Configure UFW to only allow necessary ports (80, 443, 22)
4. **Regular Updates:** Keep system packages, Node.js, and dependencies up to date
5. **Database Security:** Ensure MySQL is not accessible from external networks
6. **SSL Certificate:** Always use HTTPS in production
7. **Backup Strategy:** Implement automated daily database backups
8. **Monitor Logs:** Regularly review application and system logs for suspicious activity

---

## Support and Contact

For issues or questions related to deployment:
- Check the application logs: `pm2 logs symptom-report-generator`
- Review this guide for troubleshooting steps
- Contact your system administrator for server-specific issues

---

**End of Deployment Guide**
