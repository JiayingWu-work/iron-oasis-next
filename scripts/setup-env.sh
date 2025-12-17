#!/bin/bash

# Setup script to ensure .env.local always has the correct environment variables
# Run this after creating a new branch or cloning the repo

ENV_FILE=".env.local"

cat > "$ENV_FILE" << 'EOF'
DATABASE_URL="postgresql://neondb_owner:npg_qYL7iKGOjHR4@ep-icy-star-aho1g0q6-pooler.c-3.us-east-1.aws.neon.tech/neondb?sslmode=require"
NEON_AUTH_BASE_URL="https://ep-icy-star-aho1g0q6.neonauth.c-3.us-east-1.aws.neon.tech/neondb/auth"
EOF

echo "✓ Created $ENV_FILE with environment variables"
