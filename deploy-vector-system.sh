#!/bin/bash

# Nutrivize V2 - Pinecone Vector Database Deployment Script
# This script helps deploy the new vector-enhanced AI features

echo "🚀 Deploying Nutrivize V2 with Pinecone Vector Database"
echo "========================================================="

# Check if required environment variables are set
check_env_var() {
    if [ -z "${!1}" ]; then
        echo "❌ ERROR: Environment variable $1 is not set"
        return 1
    else
        echo "✅ $1 is configured"
        return 0
    fi
}

echo "📋 Checking required environment variables..."

# Check existing variables
check_env_var "ANTHROPIC_API_KEY"
ANTHROPIC_OK=$?

check_env_var "OPENAI_API_KEY" 
OPENAI_OK=$?

check_env_var "MONGODB_URL"
MONGODB_OK=$?

# Check new variables for Pinecone
check_env_var "PINECONE_API_KEY"
PINECONE_OK=$?

echo ""
echo "📊 Environment Check Summary:"
echo "-----------------------------"
if [ $ANTHROPIC_OK -eq 0 ]; then echo "✅ Claude AI (Anthropic) - Ready"; else echo "❌ Claude AI (Anthropic) - Missing"; fi
if [ $OPENAI_OK -eq 0 ]; then echo "✅ OpenAI Embeddings - Ready"; else echo "❌ OpenAI Embeddings - Missing"; fi
if [ $MONGODB_OK -eq 0 ]; then echo "✅ MongoDB Database - Ready"; else echo "❌ MongoDB Database - Missing"; fi
if [ $PINECONE_OK -eq 0 ]; then echo "✅ Pinecone Vector DB - Ready"; else echo "❌ Pinecone Vector DB - Missing"; fi

echo ""

# If any critical environment variables are missing, provide setup instructions
if [ $PINECONE_OK -ne 0 ] || [ $OPENAI_OK -ne 0 ]; then
    echo "🔧 SETUP REQUIRED:"
    echo "=================="
    
    if [ $PINECONE_OK -ne 0 ]; then
        echo ""
        echo "📌 Pinecone Setup:"
        echo "1. Go to https://app.pinecone.io/"
        echo "2. Create a free account (100K vectors included)"
        echo "3. Create a new project"
        echo "4. Go to API Keys and copy your API key"
        echo "5. Set environment variable: PINECONE_API_KEY=your_api_key_here"
        echo ""
        echo "Your provided API key: pcsk_3tMbDL_83ZTXkuaganqN1rXGXx6Lpk2z9FXeNhFsn9CdQkdmmnyQYtozsvRAjjyiJXTgcS"
        echo "Add this to your environment:"
        echo "export PINECONE_API_KEY=pcsk_3tMbDL_83ZTXkuaganqN1rXGXx6Lpk2z9FXeNhFsn9CdQkdmmnyQYtozsvRAjjyiJXTgcS"
    fi
    
    if [ $OPENAI_OK -ne 0 ]; then
        echo ""
        echo "🤖 OpenAI Setup:"
        echo "1. Go to https://platform.openai.com/api-keys"
        echo "2. Create a new API key"
        echo "3. Set environment variable: OPENAI_API_KEY=your_api_key_here"
        echo ""
        echo "Note: Used for text-embedding-large model (high-quality embeddings)"
    fi
    
    echo ""
    echo "🔒 For production deployment, add these to your hosting platform:"
    echo "- Render.com: Environment Variables section"
    echo "- Heroku: Config Vars"
    echo "- Vercel: Environment Variables"
    echo ""
fi

# Install new dependencies
echo "📦 Installing Pinecone dependencies..."
pip install pinecone-client

echo ""
echo "🧪 Testing Pinecone connection..."

# Test Pinecone connection if API key is available
if [ $PINECONE_OK -eq 0 ]; then
    python3 -c "
import os
try:
    from pinecone import Pinecone
    pc = Pinecone(api_key=os.getenv('PINECONE_API_KEY'))
    indexes = list(pc.list_indexes())
    print('✅ Pinecone connection successful')
    print(f'📊 Available indexes: {len(indexes)}')
except Exception as e:
    print(f'❌ Pinecone connection failed: {e}')
    exit(1)
"
    PINECONE_TEST=$?
else
    echo "⚠️ Skipping Pinecone test (API key not set)"
    PINECONE_TEST=1
fi

echo ""

# Test OpenAI connection if API key is available
if [ $OPENAI_OK -eq 0 ]; then
    echo "🧪 Testing OpenAI embeddings..."
    python3 -c "
import os
import openai
try:
    openai.api_key = os.getenv('OPENAI_API_KEY')
    response = openai.embeddings.create(
        model='text-embedding-large',
        input='test'
    )
    print('✅ OpenAI embeddings working')
    print(f'📏 Embedding dimension: {len(response.data[0].embedding)}')
except Exception as e:
    print(f'❌ OpenAI embeddings failed: {e}')
    exit(1)
"
    OPENAI_TEST=$?
else
    echo "⚠️ Skipping OpenAI test (API key not set)"
    OPENAI_TEST=1
fi

echo ""
echo "🚀 DEPLOYMENT STATUS:"
echo "===================="

if [ $PINECONE_OK -eq 0 ] && [ $OPENAI_OK -eq 0 ] && [ $PINECONE_TEST -eq 0 ] && [ $OPENAI_TEST -eq 0 ]; then
    echo "✅ All systems ready for vector-enhanced AI!"
    echo ""
    echo "🎯 New Features Available:"
    echo "- Intelligent context retrieval for Claude"
    echo "- Automatic vectorization of user data"
    echo "- Query-relevant nutrition insights"
    echo "- Enhanced meal planning with user history"
    echo "- Smart food recommendations"
    echo ""
    echo "📚 API Endpoints Added:"
    echo "- POST /vectors/bulk-vectorize - Vectorize user data"
    echo "- POST /vectors/query - Test vector retrieval"
    echo "- GET /vectors/stats - Vector statistics"
    echo "- DELETE /vectors/clear - Clear user vectors"
    echo ""
    echo "🔄 Background Processes:"
    echo "- Food logs automatically vectorized on creation"
    echo "- Meal plans automatically vectorized on save"
    echo "- User favorites vectorized on update"
    echo "- AI chat history vectorized after meaningful conversations"
    echo ""
    echo "Ready to deploy! 🚀"
else
    echo "⚠️ Setup incomplete - please configure missing environment variables"
    echo ""
    echo "Required for full functionality:"
    echo "- PINECONE_API_KEY (for vector database)"
    echo "- OPENAI_API_KEY (for embeddings)"
    echo "- ANTHROPIC_API_KEY (for Claude AI)"
    echo "- MONGODB_URL (for data storage)"
fi

echo ""
echo "📖 For more information, see the implementation documentation."
