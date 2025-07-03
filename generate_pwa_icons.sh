#!/bin/bash

# Generate PWA icons from source image
SOURCE_IMAGE="ChatGPT Image Jul 3, 2025, 03_05_43 AM.png"
ICONS_DIR="frontend/public/icons"

# Create icons directory
mkdir -p "$ICONS_DIR"

# Standard PWA icon sizes
SIZES=(16 32 72 96 128 144 152 192 384 512)

echo "Generating PWA icons from $SOURCE_IMAGE..."

# Generate standard icons
for size in "${SIZES[@]}"; do
    echo "Generating ${size}x${size} icon..."
    convert "$SOURCE_IMAGE" -resize ${size}x${size} -background transparent "$ICONS_DIR/icon-${size}x${size}.png"
done

# Generate Apple Touch icons (required for iOS)
echo "Generating Apple Touch Icons..."
convert "$SOURCE_IMAGE" -resize 180x180 -background transparent "$ICONS_DIR/apple-touch-icon.png"
convert "$SOURCE_IMAGE" -resize 152x152 -background transparent "$ICONS_DIR/apple-touch-icon-152x152.png"
convert "$SOURCE_IMAGE" -resize 167x167 -background transparent "$ICONS_DIR/apple-touch-icon-167x167.png"
convert "$SOURCE_IMAGE" -resize 180x180 -background transparent "$ICONS_DIR/apple-touch-icon-180x180.png"

# Generate favicon
echo "Generating favicon..."
convert "$SOURCE_IMAGE" -resize 32x32 -background transparent "$ICONS_DIR/favicon-32x32.png"
convert "$SOURCE_IMAGE" -resize 16x16 -background transparent "$ICONS_DIR/favicon-16x16.png"
convert "$SOURCE_IMAGE" -resize 32x32 -background transparent "frontend/public/favicon.ico"

# Generate shortcut icons
echo "Generating shortcut icons..."
convert "$SOURCE_IMAGE" -resize 96x96 -background transparent "$ICONS_DIR/shortcut-log.png"
convert "$SOURCE_IMAGE" -resize 96x96 -background transparent "$ICONS_DIR/shortcut-meals.png"

# Generate splash screen images for iOS (iPhone specific)
echo "Generating splash screens for iPhone..."
mkdir -p "$ICONS_DIR/splash"

# iPhone 14 Pro Max (430x932)
convert "$SOURCE_IMAGE" -resize 430x932 -background "#48bb78" -gravity center -extent 430x932 "$ICONS_DIR/splash/iphone-14-pro-max.png"

# iPhone 14 Pro (393x852)
convert "$SOURCE_IMAGE" -resize 393x852 -background "#48bb78" -gravity center -extent 393x852 "$ICONS_DIR/splash/iphone-14-pro.png"

# iPhone 14 (390x844)
convert "$SOURCE_IMAGE" -resize 390x844 -background "#48bb78" -gravity center -extent 390x844 "$ICONS_DIR/splash/iphone-14.png"

# iPhone SE (375x667)
convert "$SOURCE_IMAGE" -resize 375x667 -background "#48bb78" -gravity center -extent 375x667 "$ICONS_DIR/splash/iphone-se.png"

echo "✅ All PWA icons generated successfully!"
