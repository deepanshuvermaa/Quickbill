const fs = require('fs');
const path = require('path');

// Define replacements
const replacements = [
  // Navigation
  { from: "from 'expo-router'", to: "from '@/utils/navigation'" },
  { from: 'from "expo-router"', to: 'from "@/utils/navigation"' },
  
  // Status Bar
  { from: "from 'expo-status-bar'", to: "from 'react-native'" },
  { from: 'from "expo-status-bar"', to: 'from "react-native"' },
  
  // Vector Icons
  { from: "from '@expo/vector-icons'", to: "from 'react-native-vector-icons/Ionicons'" },
  { from: 'from "@expo/vector-icons"', to: 'from "react-native-vector-icons/Ionicons"' },
  
  // Specific icon imports
  { from: "import { Ionicons } from '@expo/vector-icons'", to: "import Ionicons from 'react-native-vector-icons/Ionicons'" },
  { from: 'import { Ionicons } from "@expo/vector-icons"', to: 'import Ionicons from "react-native-vector-icons/Ionicons"' },
  
  // Stack.Screen updates
  { from: '<Stack.Screen', to: '{/* Stack.Screen' },
  { from: '</Stack.Screen>', to: 'Stack.Screen */}' },
];

// Function to recursively process files
function processDirectory(dir) {
  const files = fs.readdirSync(dir);
  
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      // Skip node_modules and .git
      if (file !== 'node_modules' && file !== '.git' && file !== 'android' && file !== 'ios') {
        processDirectory(filePath);
      }
    } else if (file.endsWith('.tsx') || file.endsWith('.ts') || file.endsWith('.jsx') || file.endsWith('.js')) {
      processFile(filePath);
    }
  });
}

// Function to process a single file
function processFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;
    
    replacements.forEach(({ from, to }) => {
      if (content.includes(from)) {
        content = content.replace(new RegExp(from, 'g'), to);
        modified = true;
      }
    });
    
    if (modified) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`Updated: ${filePath}`);
    }
  } catch (error) {
    console.error(`Error processing ${filePath}:`, error.message);
  }
}

// Start processing
console.log('Starting Expo import replacement...');
processDirectory('./app');
processDirectory('./components');
processDirectory('./utils');
processDirectory('./store');
console.log('Replacement complete!');