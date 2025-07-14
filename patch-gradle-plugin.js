const fs = require('fs');
const path = require('path');

// Path to the React Native gradle plugin build.gradle.kts
const gradlePluginPath = path.join(__dirname, 'node_modules', '@react-native', 'gradle-plugin', 'build.gradle.kts');

// First restore the original file if it exists
const backupPath = gradlePluginPath + '.backup';
if (fs.existsSync(backupPath)) {
  fs.copyFileSync(backupPath, gradlePluginPath);
  console.log('ℹ️  Restored original gradle plugin from backup');
} else if (fs.existsSync(gradlePluginPath)) {
  // Create backup
  fs.copyFileSync(gradlePluginPath, backupPath);
  console.log('ℹ️  Created backup of gradle plugin');
}

if (fs.existsSync(gradlePluginPath)) {
  let content = fs.readFileSync(gradlePluginPath, 'utf8');
  
  // Find the tasks.withType<KotlinCompile> block and modify it
  const kotlinCompileRegex = /tasks\.withType<KotlinCompile>\(\)\s*{\s*kotlinOptions\s*{/;
  
  if (kotlinCompileRegex.test(content)) {
    content = content.replace(
      kotlinCompileRegex,
      `tasks.withType<KotlinCompile>() {
  kotlinOptions {
    allWarningsAsErrors = false
    suppressWarnings = true`
    );
    
    fs.writeFileSync(gradlePluginPath, content);
    console.log('✅ Patched React Native gradle plugin to disable warnings as errors');
  } else {
    console.log('❌ Could not find KotlinCompile task configuration in gradle plugin');
  }
} else {
  console.error('❌ React Native gradle plugin not found at:', gradlePluginPath);
}