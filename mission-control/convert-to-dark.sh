#!/bin/bash

# Script to convert Mission Control UI to dark mode

FILES=(
  "src/pages/Dashboard.tsx"
  "src/pages/Tasks.tsx"
  "src/pages/Weekly.tsx"
  "src/pages/Settings.tsx"
  "src/components/TaskItem.tsx"
)

for file in "${FILES[@]}"; do
  echo "Converting $file to dark mode..."

  # Backgrounds
  sed -i '' 's/bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50/bg-gray-900/g' "$file"
  sed -i '' 's/bg-gradient-to-br from-purple-50 to-pink-50/bg-gray-900/g' "$file"
  sed -i '' 's/bg-gradient-to-br from-blue-50 to-cyan-50/bg-gray-800 border border-gray-700/g' "$file"
  sed -i '' 's/bg-gradient-to-br from-yellow-50 to-orange-50/bg-gray-800 border border-gray-700/g' "$file"
  sed -i '' 's/bg-gradient-to-br from-green-50 to-emerald-50/bg-gray-800 border border-gray-700/g' "$file"
  sed -i '' 's/bg-gradient-to-br from-red-50 to-orange-50/bg-gray-800 border border-gray-700/g' "$file"
  sed -i '' 's/bg-gradient-to-br from-indigo-50 to-purple-50/bg-gray-800 border border-gray-700/g' "$file"
  sed -i '' 's/bg-white\/80/bg-gray-800/g' "$file"
  sed -i '' 's/bg-white/bg-gray-800/g' "$file"
  sed -i '' 's/from-gray-50 to-gray-100/bg-gray-700/g' "$file"

  # Borders
  sed -i '' 's/border-4 border-purple-200/border border-gray-700/g' "$file"
  sed -i '' 's/border-4 border-blue-200/border border-gray-700/g' "$file"
  sed -i '' 's/border-4 border-green-200/border border-gray-700/g' "$file"
  sed -i '' 's/border-4 border-yellow-200/border border-gray-700/g' "$file"
  sed -i '' 's/border-4 border-red-200/border border-gray-700/g' "$file"
  sed -i '' 's/border-4 border-indigo-200/border border-gray-700/g' "$file"
  sed -i '' 's/border-4 border-orange-200/border border-gray-700/g' "$file"
  sed -i '' 's/border-3 border-purple-200/border border-gray-700/g' "$file"
  sed -i '' 's/border-2 border-gray-100/border border-gray-700/g' "$file"
  sed -i '' 's/border-2 border-red-100/border border-gray-700/g' "$file"
  sed -i '' 's/border-2 border-blue-100/border border-gray-700/g' "$file"
  sed -i '' 's/border-2 border-green-200/border border-gray-700/g' "$file"

  # Text colors
  sed -i '' 's/text-gray-900/text-white/g' "$file"
  sed -i '' 's/text-gray-800/text-gray-200/g' "$file"
  sed -i '' 's/text-gray-700/text-gray-300/g' "$file"
  sed -i '' 's/text-gray-600/text-gray-400/g' "$file"
  sed -i '' 's/text-purple-600/text-indigo-400/g' "$file"
  sed -i '' 's/text-purple-700/text-indigo-300/g' "$file"
  sed -i '' 's/text-purple-800/text-indigo-300/g' "$file"
  sed -i '' 's/text-blue-600/text-blue-400/g' "$file"
  sed -i '' 's/text-blue-700/text-blue-300/g' "$file"
  sed -i '' 's/text-blue-800/text-blue-300/g' "$file"
  sed -i '' 's/text-green-600/text-green-400/g' "$file"
  sed -i '' 's/text-green-700/text-green-300/g' "$file"
  sed -i '' 's/text-green-800/text-green-300/g' "$file"
  sed -i '' 's/text-red-600/text-red-400/g' "$file"
  sed -i '' 's/text-red-700/text-red-300/g' "$file"
  sed -i '' 's/text-red-800/text-red-300/g' "$file"
  sed -i '' 's/text-orange-600/text-orange-400/g' "$file"
  sed -i '' 's/text-orange-700/text-orange-300/g' "$file"
  sed -i '' 's/text-orange-800/text-orange-300/g' "$file"
  sed -i '' 's/text-indigo-900/text-indigo-300/g' "$file"
  sed -i '' 's/text-indigo-800/text-indigo-300/g' "$file"
  sed -i '' 's/text-yellow-800/text-yellow-300/g' "$file"

  # Buttons and interactive elements
  sed -i '' 's/bg-gradient-to-r from-purple-500 to-pink-500/bg-indigo-600/g' "$file"
  sed -i '' 's/hover:from-purple-600 hover:to-pink-600/hover:bg-indigo-700/g' "$file"
  sed -i '' 's/from-red-500 to-red-600/bg-red-600/g' "$file"
  sed -i '' 's/hover:from-red-600 hover:to-red-700/hover:bg-red-700/g' "$file"
  sed -i '' 's/from-green-500 to-emerald-500/bg-green-600/g' "$file"
  sed -i '' 's/hover:from-green-600 hover:to-emerald-600/hover:bg-green-700/g' "$file"
  sed -i '' 's/bg-purple-100/bg-indigo-900\/30/g' "$file"
  sed -i '' 's/bg-blue-50/bg-blue-900\/30/g' "$file"
  sed -i '' 's/bg-green-50/bg-green-900\/30/g' "$file"
  sed -i '' 's/bg-red-50/bg-red-900\/30/g' "$file"
  sed -i '' 's/bg-yellow-50/bg-yellow-900\/30/g' "$file"
  sed -i '' 's/bg-orange-50/bg-orange-900\/30/g' "$file"
  sed -i '' 's/hover:bg-gray-50/hover:bg-gray-700/g' "$file"
  sed -i '' 's/hover:bg-purple-100/hover:bg-gray-700/g' "$file"
  sed -i '' 's/hover:bg-blue-50/hover:bg-gray-700/g' "$file"

  # Loading and spinners
  sed -i '' 's/border-purple-200/border-gray-600/g' "$file"
  sed -i '' 's/border-t-purple-600/border-t-indigo-500/g' "$file"

  # Rounded corners - make less funky
  sed -i '' 's/rounded-3xl/rounded-lg/g' "$file"
  sed -i '' 's/rounded-2xl/rounded-lg/g' "$file"
  sed -i '' 's/rounded-full/rounded-lg/g' "$file"

  # Font weights - less aggressive
  sed -i '' 's/font-black/font-bold/g' "$file"

  # Placeholder text
  sed -i '' 's/placeholder-purple-300/placeholder-gray-500/g' "$file"

  echo "✓ Converted $file"
done

echo ""
echo "Dark mode conversion complete!"
echo "Note: Manual review recommended for complex gradients and emojis"
