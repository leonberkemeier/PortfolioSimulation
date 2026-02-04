#!/bin/bash

echo "🚀 Setting up Trading Simulator with Authentication"
echo "=================================================="

# Backend setup
echo ""
echo "📦 Installing backend dependencies..."
cd backend
pip install -r requirements.txt

echo ""
echo "🗄️  Running database migration..."
python migrate_db.py

echo ""
echo "👤 Creating admin user..."
python create_admin.py

echo ""
echo "✅ Backend setup complete!"

# Frontend setup
echo ""
echo "📦 Installing frontend dependencies..."
cd ../frontend2
npm install

echo ""
echo "✅ Frontend setup complete!"
echo ""
echo "=================================================="
echo "🎉 Setup complete!"
echo ""
echo "To start the application:"
echo "1. Backend:  cd backend && uvicorn src.api.main:app --host 0.0.0.0 --port 8001 --reload"
echo "2. Frontend: cd frontend2 && npm run dev"
echo ""
echo "Default login will be at: http://localhost:5173/login"
echo ""
echo "💡 Only admins can create new users via the API"
echo ""
