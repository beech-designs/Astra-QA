#!/bin/bash

echo "🚀 Setting up Astra QA Chrome Extension..."

# Check prerequisites
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is required but not installed."
    exit 1
fi

if ! command -v npm &> /dev/null; then
    echo "❌ npm is required but not installed."
    exit 1
fi

# Setup backend dependencies
echo "📦 Installing backend dependencies..."
cd ../backend
npm install

# Setup environment
if [ ! -f .env ]; then
    cp .env.example .env
    echo "📝 Created .env file. Add your Anthropic API key if not present."
else
    echo "✅ .env file already exists"
fi

# Download html2canvas for the extension
echo "📥 Downloading html2canvas..."
mkdir -p ../extension/lib
cd ../extension/lib
if [ ! -f html2canvas.min.js ]; then
    curl -o html2canvas.min.js https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js
    echo "✅ html2canvas downloaded"
else
    echo "✅ html2canvas already exists"
fi

cd ../../scripts

echo ""
echo "🎉 Setup complete!"
echo "Next steps:"
echo "1. Deploy backend: cd ../backend && vercel --prod"
echo "2. Load extension in Chrome from the extension/ folder"
echo "3. Configure extension with your Vercel backend URL"