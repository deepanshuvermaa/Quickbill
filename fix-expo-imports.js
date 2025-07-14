const fs = require('fs');
const path = require('path');

const replacements = [
  // Expo Router
  {
    pattern: /import\s+{\s*([^}]+)\s*}\s+from\s+['"]expo-router['"]/g,
    replacement: (match, imports) => {
      const importList = imports.split(',').map(i => i.trim());
      const mappedImports = [];
      const navigationImports = [];
      
      importList.forEach(imp => {
        if (imp === 'Stack' || imp === 'Tabs') {
          // These are handled by React Navigation now
          return;
        } else if (imp === 'useRouter' || imp === 'useLocalSearchParams' || imp === 'usePathname' || imp === 'useGlobalSearchParams') {
          navigationImports.push(imp);
        } else if (imp === 'Link') {
          navigationImports.push(imp);
        } else {
          mappedImports.push(imp);
        }
      });
      
      let result = '';
      if (navigationImports.length > 0) {
        result += `import { ${navigationImports.join(', ')} } from '@/utils/navigation'`;
      }
      if (mappedImports.length > 0) {
        if (result) result += ';\n';
        result += `import { ${mappedImports.join(', ')} } from '@/utils/navigation'`;
      }
      return result || '// Removed expo-router import';
    }
  },
  // Expo Font
  {
    pattern: /import\s+{\s*useFonts\s*}\s+from\s+['"]expo-font['"]/g,
    replacement: "// Fonts are handled by React Native now"
  },
  // Expo Status Bar
  {
    pattern: /import\s+{\s*StatusBar\s*}\s+from\s+['"]expo-status-bar['"]/g,
    replacement: "import { StatusBar } from 'react-native'"
  },
  // Expo Print
  {
    pattern: /import\s+\*\s+as\s+Print\s+from\s+['"]expo-print['"]/g,
    replacement: "import RNPrint from 'react-native-print'"
  },
  // Expo Sharing
  {
    pattern: /import\s+\*\s+as\s+Sharing\s+from\s+['"]expo-sharing['"]/g,
    replacement: "import Share from 'react-native-share'"
  },
  // Expo Vector Icons
  {
    pattern: /import\s+{\s*([^}]+)\s*}\s+from\s+['"]@expo\/vector-icons['"]/g,
    replacement: (match, iconSet) => {
      return `import ${iconSet.trim()} from 'react-native-vector-icons/${iconSet.trim()}'`;
    }
  },
  // Expo Splash Screen
  {
    pattern: /import\s+\*\s+as\s+SplashScreen\s+from\s+['"]expo-splash-screen['"]/g,
    replacement: "import SplashScreen from 'react-native-splash-screen'"
  }
];

function processFile(filePath) {
  if (!filePath.endsWith('.tsx') && !filePath.endsWith('.ts') && !filePath.endsWith('.jsx') && !filePath.endsWith('.js')) {
    return;
  }
  
  let content = fs.readFileSync(filePath, 'utf8');
  let modified = false;
  
  replacements.forEach(({ pattern, replacement }) => {
    if (pattern.test(content)) {
      content = content.replace(pattern, replacement);
      modified = true;
    }
  });
  
  // Remove Stack.Screen components
  const stackScreenPattern = /<Stack\.Screen[^>]*\/>/g;
  const stackScreenMultilinePattern = /<Stack\.Screen[^>]*>[^<]*<\/Stack\.Screen>/g;
  
  if (stackScreenPattern.test(content) || stackScreenMultilinePattern.test(content)) {
    content = content.replace(stackScreenPattern, '');
    content = content.replace(stackScreenMultilinePattern, '');
    modified = true;
  }
  
  // Remove useFonts calls
  const useFontsPattern = /const\s+\[loaded[^\]]*\]\s*=\s*useFonts\([^)]+\);?/g;
  const fontCheckPattern = /if\s*\(!loaded\)\s*{\s*return\s+null;\s*}/g;
  
  if (useFontsPattern.test(content) || fontCheckPattern.test(content)) {
    content = content.replace(useFontsPattern, '');
    content = content.replace(fontCheckPattern, '');
    modified = true;
  }
  
  if (modified) {
    fs.writeFileSync(filePath, content);
    console.log(`Updated: ${filePath}`);
  }
}

function processDirectory(dir) {
  const files = fs.readdirSync(dir);
  
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory() && !file.startsWith('.') && file !== 'node_modules') {
      processDirectory(filePath);
    } else if (stat.isFile()) {
      processFile(filePath);
    }
  });
}

// Process app directory
console.log('Processing app directory...');
processDirectory(path.join(__dirname, 'app'));

// Process components directory
console.log('Processing components directory...');
processDirectory(path.join(__dirname, 'components'));

// Process store directory
console.log('Processing store directory...');
processDirectory(path.join(__dirname, 'store'));

// Process utils directory
console.log('Processing utils directory...');
processDirectory(path.join(__dirname, 'utils'));

console.log('Done! All Expo imports have been replaced.');