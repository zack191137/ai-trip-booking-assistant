#!/bin/bash

# Script to push to GitHub
# Replace 'yourusername' with your GitHub username

echo "🚀 Pushing to GitHub..."

# Add remote origin (replace with your GitHub username)
git remote add origin https://github.com/yourusername/ai-trip-booking-assistant.git

# Push to main branch
git push -u origin main

echo "✅ Push complete!"
echo ""
echo "Next steps:"
echo "1. Update the GitHub URL in README.md"
echo "2. Update the GitHub URL in deploy scripts"
echo "3. Add your Gemini API key as a GitHub secret if using GitHub Actions"