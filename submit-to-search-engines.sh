#!/bin/bash

# Nutrivize Search Engine Submission Script
# Run this after nutrivize.app is live with DNS configured

echo "🚀 Nutrivize SEO Deployment Script"
echo "=================================="

DOMAIN="https://nutrivize.app"
SITEMAP_URL="$DOMAIN/sitemap.xml"

echo "Domain: $DOMAIN"
echo "Sitemap: $SITEMAP_URL"
echo ""

# Test if site is live
echo "1. Testing if site is accessible..."
if curl -f -s $DOMAIN > /dev/null; then
    echo "✅ Site is live and accessible"
else
    echo "❌ Site is not accessible yet. Please check DNS configuration."
    exit 1
fi

# Test sitemap
echo ""
echo "2. Testing sitemap accessibility..."
if curl -f -s $SITEMAP_URL > /dev/null; then
    echo "✅ Sitemap is accessible"
else
    echo "❌ Sitemap not found. Please check deployment."
    exit 1
fi

# Test robots.txt
echo ""
echo "3. Testing robots.txt..."
if curl -f -s "$DOMAIN/robots.txt" > /dev/null; then
    echo "✅ Robots.txt is accessible"
else
    echo "❌ Robots.txt not found."
fi

echo ""
echo "📋 Manual Steps Required:"
echo "========================"
echo ""

echo "🔍 Google Search Console:"
echo "1. Go to: https://search.google.com/search-console"
echo "2. Add property: $DOMAIN"  
echo "3. Verify ownership using HTML file: google12345abcdef67890.html"
echo "4. Submit sitemap: $SITEMAP_URL"
echo ""

echo "🔍 Bing Webmaster Tools:"
echo "1. Go to: https://www.bing.com/webmasters"
echo "2. Add site: $DOMAIN"
echo "3. Verify using XML file: BingSiteAuth.xml"  
echo "4. Submit sitemap: $SITEMAP_URL"
echo ""

echo "📊 Analytics Setup:"
echo "1. Google Analytics 4: https://analytics.google.com"
echo "2. Install GA4 tracking code in app"
echo "3. Link Search Console to Analytics"
echo ""

echo "🎯 SEO Monitoring:"
echo "1. Set up keyword tracking"
echo "2. Monitor Core Web Vitals"
echo "3. Track organic traffic growth"
echo "4. Check indexation status weekly"
echo ""

echo "✅ Technical SEO implementation is complete!"
echo "🚀 Ready for search engine submission!"

# Optional: Auto-ping search engines (if you want to be notified when they crawl)
echo ""
echo "🔔 Notifying search engines of new content..."

# Google ping (unofficial)
curl -s "https://www.google.com/ping?sitemap=$SITEMAP_URL" > /dev/null && echo "✅ Google notified" || echo "❌ Google ping failed"

# Bing ping  
curl -s "https://www.bing.com/ping?sitemap=$SITEMAP_URL" > /dev/null && echo "✅ Bing notified" || echo "❌ Bing ping failed"

echo ""
echo "🎉 SEO setup complete! Monitor rankings in 24-48 hours."
