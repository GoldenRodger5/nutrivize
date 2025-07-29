# 🌐 Cloudflare DNS Configuration for nutrivize.app

## DNS Records Setup

Configure the following DNS records in your Cloudflare dashboard:

### A Records (if using static IPs)
```
Type: A
Name: @
Content: [Your Hosting Provider IP]
TTL: Auto
Proxy Status: Proxied 🧡
```

```
Type: A  
Name: www
Content: [Your Hosting Provider IP]
TTL: Auto
Proxy Status: Proxied 🧡
```

### CNAME Records (Recommended for hosting platforms)
```
Type: CNAME
Name: @
Content: [Your Vercel/Netlify domain]
TTL: Auto
Proxy Status: Proxied 🧡
```

```
Type: CNAME
Name: www
Content: nutrivize.app
TTL: Auto
Proxy Status: Proxied 🧡
```

```
Type: CNAME
Name: api
Content: [Your Render backend URL]
TTL: Auto
Proxy Status: Proxied 🧡
```

### Email Records (for support emails)
```
Type: MX
Name: @
Content: route1.mx.cloudflare.net
Priority: 10
TTL: Auto
```

```
Type: MX
Name: @
Content: route2.mx.cloudflare.net
Priority: 20
TTL: Auto
```

### Additional Subdomains
```
Type: CNAME
Name: status
Content: [Your status page service]
TTL: Auto
Proxy Status: Proxied 🧡
```

```
Type: CNAME
Name: docs
Content: [Your documentation site]
TTL: Auto
Proxy Status: Proxied 🧡
```

```
Type: CNAME
Name: help
Content: [Your help center]
TTL: Auto
Proxy Status: Proxied 🧡
```

## SSL/TLS Configuration

### 1. SSL/TLS Encryption Mode
- Go to **SSL/TLS** → **Overview**
- Set to **Full (strict)** for maximum security

### 2. Edge Certificates
- **Always Use HTTPS**: ON
- **HTTP Strict Transport Security (HSTS)**: Enable
- **Minimum TLS Version**: 1.2
- **Opportunistic Encryption**: ON
- **TLS 1.3**: ON

### 3. Origin Server
- Generate Origin Certificate if needed
- Configure your hosting provider with the certificate

## Page Rules (Optional Performance Optimization)

### Cache Everything for Static Assets
```
URL: nutrivize.app/assets/*
Settings: Cache Level = Cache Everything
```

### Always HTTPS
```
URL: *nutrivize.app/*
Settings: Always Use HTTPS = ON
```

## Security Settings

### 1. Firewall Rules
- **Security Level**: Medium
- **Challenge Passage**: 30 minutes
- **Browser Integrity Check**: ON

### 2. DDoS Protection
- Automatic DDoS protection is enabled by default

### 3. Bot Management
- Configure as needed for your traffic patterns

## Email Routing Setup

### 1. Enable Email Routing
- Go to **Email** → **Email Routing**
- Click **Enable Email Routing**

### 2. Create Email Addresses
Configure forwarding for:
- `support@nutrivize.app` → your-email@gmail.com
- `privacy@nutrivize.app` → your-email@gmail.com
- `legal@nutrivize.app` → your-email@gmail.com
- `tech@nutrivize.app` → your-email@gmail.com
- `business@nutrivize.app` → your-email@gmail.com
- `press@nutrivize.app` → your-email@gmail.com
- `security@nutrivize.app` → your-email@gmail.com

## Performance Optimization

### 1. Speed Settings
- **Auto Minify**: HTML, CSS, JavaScript = ON
- **Brotli**: ON
- **Enhanced HTTP/2 Prioritization**: ON

### 2. Caching
- **Browser Cache TTL**: 4 hours
- **Always Online**: ON

### 3. Polish (Image Optimization)
- **Polish**: Lossy (if you have many images)

## Analytics & Monitoring

### 1. Web Analytics
- Enable Cloudflare Web Analytics
- Add tracking code to your frontend

### 2. Notifications
- Set up notifications for:
  - Certificate expiration
  - High error rates
  - DDoS attacks

## Deployment Platform Configuration

### For Vercel (Frontend)
1. Add custom domain in Vercel dashboard
2. Point to `nutrivize.app` and `www.nutrivize.app`
3. Configure environment variables with new API URL

### For Render (Backend)  
1. Add custom domain in Render dashboard
2. Point to `api.nutrivize.app`
3. Update CORS settings with new frontend domains

### For Netlify (Alternative Frontend)
1. Add custom domain in Netlify dashboard
2. Configure redirects if needed
3. Update environment variables

## Testing Your Setup

### 1. DNS Propagation
```bash
# Check DNS propagation
dig nutrivize.app
dig api.nutrivize.app
dig www.nutrivize.app
```

### 2. SSL Certificate
```bash
# Test SSL certificate
curl -I https://nutrivize.app
curl -I https://api.nutrivize.app
```

### 3. API Connectivity
```bash
# Test API endpoint
curl https://api.nutrivize.app/health
```

### 4. Run Production Tests
```bash
# Run production API tests
python test_production_api.py
```

## Troubleshooting

### Common Issues

#### 1. DNS Not Resolving
- Wait for DNS propagation (up to 48 hours)
- Check DNS records are correct
- Verify proxy status settings

#### 2. SSL Certificate Errors
- Ensure SSL/TLS mode is set correctly
- Check origin server certificate
- Verify hosting platform SSL settings

#### 3. CORS Errors
- Update backend CORS settings
- Verify frontend environment variables
- Check API endpoint URLs

#### 4. Email Not Working
- Verify MX records are set
- Check Email Routing configuration
- Test email forwarding

## Security Checklist

- [ ] SSL/TLS set to Full (strict)
- [ ] HSTS enabled
- [ ] Always Use HTTPS enabled
- [ ] Firewall rules configured
- [ ] Bot management configured
- [ ] Security level appropriate
- [ ] Origin server secured
- [ ] API rate limiting configured

## Final Steps

1. **Test Everything**: Use the production test script
2. **Monitor Performance**: Check Cloudflare Analytics
3. **Update Documentation**: Ensure all links point to new domain
4. **Notify Users**: If migrating from another domain
5. **SEO**: Set up redirects from old domain if applicable

---

*This guide covers the complete setup for nutrivize.app with Cloudflare DNS. Follow each section carefully and test thoroughly.*
