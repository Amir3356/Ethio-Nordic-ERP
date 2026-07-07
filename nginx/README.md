# Ethio Nordic ERP - Nginx API Gateway Setup

## Quick Setup (Windows)

### 1. Copy the config file

Copy `nginx/ethio-nordic-erp.conf` to your Nginx conf directory:

```powershell
# Example: if Nginx is installed at C:\nginx
Copy-Item nginx\ethio-nordic-erp.conf C:\nginx\conf\ethio-nordic-erp.conf
```

### 2. Include it in nginx.conf

Edit your `C:\nginx\conf\nginx.conf` and add inside the `http` block:

```nginx
http {
    # ... existing config ...

    # Include Ethio Nordic ERP config
    include ethio-nordic-erp.conf;
}
```

### 3. Create logs directory

```powershell
mkdir C:\nginx\logs
```

### 4. Start/Restart Nginx

```powershell
# Test configuration
C:\nginx\nginx.exe -t

# Start Nginx
C:\nginx\nginx.exe

# Or restart if already running
C:\nginx\nginx.exe -s reload
```

### 5. Start your services

```bash
# Terminal 1: Laravel
cd server
php artisan serve

# Terminal 2: React/Vite
cd client
npm run dev
```

### 6. Access via Nginx

- **App**: http://localhost
- **API**: http://localhost/api/health

---

## Rate Limits

| Endpoint | Limit | Purpose |
|----------|-------|---------|
| `/api/auth/login` | 3 req/s | Brute-force protection |
| `/api/auth/*` | 5 req/s | Authentication |
| `/api/users/bulk-action` | 1 req/s | Heavy operations |
| `/api/*` (general) | 30 req/s | General API |

When rate limited, you'll receive HTTP 429.
