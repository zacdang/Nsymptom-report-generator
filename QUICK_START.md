# Quick Start Guide

## For First-Time Deployment

### Prerequisites
- Ubuntu 20.04+ server
- Root or sudo access
- MySQL database (or plan to install)

### Automated Deployment (Recommended)

1. **Upload files to your server:**
   ```bash
   scp -r symptom-report-generator user@YOUR_SERVER_IP:/home/user/
   ```

2. **SSH into your server:**
   ```bash
   ssh user@YOUR_SERVER_IP
   ```

3. **Navigate to the project directory:**
   ```bash
   cd symptom-report-generator
   ```

4. **Run the deployment script:**
   ```bash
   ./deploy.sh
   ```

5. **Follow the prompts** to configure database and Nginx

6. **Access your application:**
   - Local: `http://localhost:3000`
   - With Nginx: `http://YOUR_DOMAIN`

### Default Credentials
- **Username:** `admin`
- **Password:** `admin123`

**⚠️ IMPORTANT:** Change the admin password immediately after first login!

---

## Manual Deployment

If you prefer manual deployment, follow the detailed steps in [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md).

---

## Post-Deployment

### Change Admin Password
1. Login as admin
2. Go to Employees tab
3. Click "Reset Password" for admin user
4. Enter new strong password

### Add Employees
1. Login as admin
2. Go to Employees tab
3. Click "Add Employee"
4. Fill in details and save

### Add Symptoms
1. Login as admin
2. Go to Symptoms tab
3. Click "Add Symptom"
4. Fill in symptom name, long text, and display order

---

## Useful Commands

### Check Application Status
```bash
pm2 status
```

### View Logs
```bash
pm2 logs symptom-report-generator
```

### Restart Application
```bash
pm2 restart symptom-report-generator
```

### Stop Application
```bash
pm2 stop symptom-report-generator
```

### Update Application
```bash
cd /path/to/symptom-report-generator
git pull  # or upload new files
pnpm install
pnpm build
pm2 restart symptom-report-generator
```

---

## Troubleshooting

### Application Won't Start
- Check logs: `pm2 logs symptom-report-generator`
- Verify database connection in `.env`
- Ensure port 3000 is not in use

### PDF Generation Fails
- Verify WeasyPrint: `weasyprint --version`
- Check Chinese fonts: `fc-list :lang=zh`
- Install missing dependencies from DEPLOYMENT_GUIDE.md

### Can't Access Application
- Check firewall: `sudo ufw status`
- Verify Nginx: `sudo nginx -t`
- Check PM2: `pm2 status`

---

## Support

For detailed deployment instructions, see [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md).
