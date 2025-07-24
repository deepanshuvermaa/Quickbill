import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { colors } from '@/constants/colors';

export default function TestApiSimple() {
  const router = useRouter();
  const [results, setResults] = useState<string[]>([]);
  
  const addLog = (message: string) => {
    setResults(prev => [...prev, `${new Date().toTimeString().split(' ')[0]} - ${message}`]);
  };
  
  const testBasicFetch = async () => {
    addLog('Starting basic fetch test...');
    
    try {
      // Test 1: Simple fetch to Google
      addLog('Test 1: Fetching google.com');
      const response1 = await fetch('https://www.google.com');
      addLog(`Google fetch: ${response1.status}`);
    } catch (error: any) {
      addLog(`Google fetch error: ${error.message}`);
    }
    
    try {
      // Test 2: Fetch JSON from public API
      addLog('Test 2: Fetching JSON from public API');
      const response2 = await fetch('https://jsonplaceholder.typicode.com/posts/1');
      const data2 = await response2.json();
      addLog(`JSON fetch success: ${data2.title?.substring(0, 20)}...`);
    } catch (error: any) {
      addLog(`JSON fetch error: ${error.message}`);
    }
    
    try {
      // Test 3: Your Railway API - just the base URL
      addLog('Test 3: Fetching Railway API health');
      const response3 = await fetch('https://quickbill-production.up.railway.app/health');
      addLog(`Railway health: ${response3.status}`);
      const text = await response3.text();
      addLog(`Response: ${text.substring(0, 50)}...`);
    } catch (error: any) {
      addLog(`Railway health error: ${error.message}`);
    }
    
    try {
      // Test 4: Your API with timeout
      addLog('Test 4: Fetching plans with timeout');
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000);
      
      const response4 = await fetch(
        'https://quickbill-production.up.railway.app/api/subscriptions/plans',
        { signal: controller.signal }
      );
      clearTimeout(timeoutId);
      
      addLog(`Plans fetch: ${response4.status}`);
      if (response4.ok) {
        const data = await response4.json();
        addLog(`Plans loaded: ${JSON.stringify(data).substring(0, 50)}...`);
      }
    } catch (error: any) {
      addLog(`Plans fetch error: ${error.message}`);
      if (error.name === 'AbortError') {
        addLog('Request timed out after 3 seconds');
      }
    }
    
    addLog('All tests completed');
  };
  
  const clearLogs = () => {
    setResults([]);
  };
  
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>API Debug Test</Text>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>
      </View>
      
      <View style={styles.buttonContainer}>
        <TouchableOpacity onPress={testBasicFetch} style={styles.button}>
          <Text style={styles.buttonText}>Run Tests</Text>
        </TouchableOpacity>
        
        <TouchableOpacity onPress={clearLogs} style={styles.clearButton}>
          <Text style={styles.buttonText}>Clear</Text>
        </TouchableOpacity>
      </View>
      
      <ScrollView style={styles.logContainer}>
        {results.map((result, index) => (
          <Text key={index} style={styles.logText}>{result}</Text>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
  },
  backButton: {
    padding: 10,
  },
  backText: {
    color: colors.primary,
    fontSize: 16,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 20,
  },
  button: {
    flex: 1,
    backgroundColor: colors.primary,
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  clearButton: {
    flex: 1,
    backgroundColor: colors.danger,
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonText: {
    color: colors.white,
    fontWeight: '600',
  },
  logContainer: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    padding: 10,
  },
  logText: {
    fontSize: 12,
    color: colors.text,
    marginBottom: 5,
    fontFamily: 'monospace',
  },
});