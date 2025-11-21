#!/bin/bash

echo "🔍 Mission Control Setup Checker"
echo "================================"
echo ""

# Check if .env exists
if [ ! -f ".env" ]; then
    echo "❌ .env file not found"
    echo "   Run: cp .env.example .env"
    exit 1
fi

echo "✅ .env file exists"
echo ""

# Check each required variable
required_vars=(
    "VITE_FIREBASE_API_KEY"
    "VITE_FIREBASE_AUTH_DOMAIN"
    "VITE_FIREBASE_PROJECT_ID"
    "VITE_FIREBASE_STORAGE_BUCKET"
    "VITE_FIREBASE_MESSAGING_SENDER_ID"
    "VITE_FIREBASE_APP_ID"
    "VITE_GOOGLE_CLIENT_ID"
    "VITE_GOOGLE_API_KEY"
)

missing=0
placeholder=0

for var in "${required_vars[@]}"; do
    value=$(grep "^$var=" .env | cut -d'=' -f2)
    
    if [ -z "$value" ]; then
        echo "❌ $var is missing"
        missing=$((missing + 1))
    elif [[ "$value" == *"your_"* ]] || [[ "$value" == *"_here"* ]]; then
        echo "⚠️  $var needs to be updated (still has placeholder)"
        placeholder=$((placeholder + 1))
    else
        echo "✅ $var is configured"
    fi
done

echo ""
echo "================================"

if [ $missing -gt 0 ]; then
    echo "❌ $missing variables are missing"
elif [ $placeholder -gt 0 ]; then
    echo "⚠️  $placeholder variables need real values"
    echo ""
    echo "Next steps:"
    echo "1. Open SETUP-GUIDE.md"
    echo "2. Follow the steps to get your Firebase and Google API credentials"
    echo "3. Update the .env file with real values"
else
    echo "✅ All variables are configured!"
    echo ""
    echo "You're ready to run:"
    echo "  npm install"
    echo "  npm run dev"
fi

echo ""
