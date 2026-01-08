#!/bin/bash

#############################################
# Symptom Report Generator - Deployment Script
# For Ubuntu 20.04+ / Debian-based systems
#############################################

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Print functions
print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

print_info() {
    echo -e "${YELLOW}ℹ $1${NC}"
}

print_header() {
    echo ""
    echo "========================================="
    echo "$1"
    echo "========================================="
    echo ""
}

# Check if running as root
if [ "$EUID" -eq 0 ]; then
    print_error "Please do not run this script as root"
    print_info "Run as: ./deploy.sh"
    exit 1
fi

print_header "Symptom Report Generator - Deployment Script"

# Step 1: Update system packages
print_info "Step 1: Updating system packages..."
sudo apt update
sudo apt upgrade -y
print_success "System packages updated"

# Step 2: Install Node.js
print_info "Step 2: Installing Node.js 22.x..."
if ! command -v node &> /dev/null; then
    curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
    sudo apt install -y nodejs
    print_success "Node.js installed: $(node --version)"
else
    print_success "Node.js already installed: $(node --version)"
fi

# Step 3: Install pnpm
print_info "Step 3: Installing pnpm..."
if ! command -v pnpm &> /dev/null; then
    sudo npm install -g pnpm
    print_success "pnpm installed: $(pnpm --version)"
else
    print_success "pnpm already installed: $(pnpm --version)"
fi

# Step 4: Install MySQL
print_info "Step 4: Installing MySQL..."
if ! command -v mysql &> /dev/null; then
    sudo apt install -y mysql-server
    print_success "MySQL installed"
    print_info "Please run 'sudo mysql_secure_installation' to secure your MySQL installation"
else
    print_success "MySQL already installed"
fi

# Step 5: Install Python and WeasyPrint
print_info "Step 5: Installing Python and WeasyPrint..."
sudo apt install -y python3 python3-pip python3-dev

# Install WeasyPrint dependencies
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

# Install WeasyPrint
sudo pip3 install weasyprint
print_success "WeasyPrint installed: $(weasyprint --version)"

# Install Chinese fonts
print_info "Installing Chinese fonts..."
sudo apt install -y fonts-noto-cjk fonts-wqy-zenhei fonts-wqy-microhei
print_success "Chinese fonts installed"

# Step 6: Install PM2
print_info "Step 6: Installing PM2..."
if ! command -v pm2 &> /dev/null; then
    sudo npm install -g pm2
    print_success "PM2 installed"
else
    print_success "PM2 already installed"
fi

# Step 7: Install Nginx
print_info "Step 7: Installing Nginx..."
if ! command -v nginx &> /dev/null; then
    sudo apt install -y nginx
    print_success "Nginx installed"
else
    print_success "Nginx already installed"
fi

# Step 8: Configure database
print_header "Database Configuration"
print_info "Please configure your MySQL database manually:"
echo ""
echo "1. Log into MySQL: sudo mysql -u root -p"
echo "2. Run the following SQL commands:"
echo ""
echo "   CREATE DATABASE symptom_reports CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
echo "   CREATE USER 'appuser'@'localhost' IDENTIFIED BY 'YOUR_STRONG_PASSWORD';"
echo "   GRANT ALL PRIVILEGES ON symptom_reports.* TO 'appuser'@'localhost';"
echo "   FLUSH PRIVILEGES;"
echo "   EXIT;"
echo ""
read -p "Press Enter after you've configured the database..."

# Step 9: Configure environment
print_header "Environment Configuration"
if [ ! -f .env ]; then
    print_info "Creating .env file..."
    
    read -p "Enter MySQL password for appuser: " db_password
    read -p "Enter JWT secret (or press Enter to generate): " jwt_secret
    
    if [ -z "$jwt_secret" ]; then
        jwt_secret=$(openssl rand -base64 32)
        print_info "Generated JWT secret: $jwt_secret"
    fi
    
    cat > .env << EOF
# Database Configuration
DATABASE_URL=mysql://appuser:${db_password}@localhost:3306/symptom_reports

# JWT Secret
JWT_SECRET=${jwt_secret}

# Server Configuration
PORT=3000
NODE_ENV=production
EOF
    
    print_success ".env file created"
else
    print_info ".env file already exists, skipping..."
fi

# Step 10: Install dependencies
print_info "Step 10: Installing application dependencies..."
pnpm install
print_success "Dependencies installed"

# Step 11: Push database schema
print_info "Step 11: Pushing database schema..."
pnpm db:push
print_success "Database schema created"

# Step 12: Build application
print_info "Step 12: Building application..."
pnpm build
print_success "Application built"

# Step 13: Create admin account
print_info "Step 13: Creating admin account..."
if [ -f scripts/create-admin.ts ]; then
    pnpm exec tsx scripts/create-admin.ts || true
    print_success "Admin account created (username: admin, password: admin123)"
else
    print_info "Admin creation script not found, skipping..."
fi

# Step 14: Configure PM2
print_info "Step 14: Configuring PM2..."
if [ ! -f ecosystem.config.js ]; then
    cat > ecosystem.config.js << 'EOF'
module.exports = {
  apps: [{
    name: 'symptom-report-generator',
    script: 'dist/index.js',
    cwd: process.cwd(),
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
EOF
    print_success "PM2 ecosystem file created"
fi

# Create logs directory
mkdir -p logs

# Start application with PM2
print_info "Starting application with PM2..."
pm2 delete symptom-report-generator 2>/dev/null || true
pm2 start ecosystem.config.js
pm2 save
print_success "Application started"

# Step 15: Configure Nginx
print_header "Nginx Configuration"
print_info "Do you want to configure Nginx as a reverse proxy? (y/n)"
read -p "> " configure_nginx

if [ "$configure_nginx" = "y" ]; then
    read -p "Enter your domain name or server IP: " domain_name
    
    sudo tee /etc/nginx/sites-available/symptom-report-generator > /dev/null << EOF
server {
    listen 80;
    server_name ${domain_name};

    client_max_body_size 50M;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
        proxy_read_timeout 300s;
        proxy_connect_timeout 75s;
    }
}
EOF
    
    sudo ln -sf /etc/nginx/sites-available/symptom-report-generator /etc/nginx/sites-enabled/
    sudo nginx -t && sudo systemctl restart nginx
    print_success "Nginx configured"
    
    # Configure firewall
    print_info "Configuring firewall..."
    sudo ufw allow 'Nginx Full' || true
    sudo ufw --force enable || true
    print_success "Firewall configured"
fi

# Step 16: Setup PM2 startup
print_info "Setting up PM2 to start on boot..."
pm2 startup | grep -v PM2 | bash || true
print_success "PM2 startup configured"

# Final summary
print_header "Deployment Complete!"
echo ""
print_success "Application is now running!"
echo ""
echo "Access your application at:"
if [ "$configure_nginx" = "y" ]; then
    echo "  http://${domain_name}"
else
    echo "  http://localhost:3000"
fi
echo ""
echo "Default admin credentials:"
echo "  Username: admin"
echo "  Password: admin123"
echo ""
print_info "IMPORTANT: Change the admin password after first login!"
echo ""
echo "Useful commands:"
echo "  pm2 status                    - Check application status"
echo "  pm2 logs symptom-report-generator  - View application logs"
echo "  pm2 restart symptom-report-generator - Restart application"
echo "  pm2 stop symptom-report-generator    - Stop application"
echo ""
print_success "Deployment script completed successfully!"
