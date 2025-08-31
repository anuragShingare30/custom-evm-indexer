#!/usr/bin/env node

// Test script to verify database event storage
import { DatabaseService } from './app/lib/database.js';

async function testEventStorage() {
  try {
    console.log('Testing event storage...');
    
    // Test contract creation
    const testContract = await DatabaseService.createOrUpdateContract(
      '0x1234567890123456789012345678901234567890',
      [{ type: 'function', name: 'test' }],
      'sepolia',
      'Test Contract'
    );
    
    console.log('✅ Contract created:', testContract.id);
    
    // Test event storage with a simple mock event
    const mockEvents = [{
      blockNumber: '1000000',
      blockHash: '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890',
      transactionHash: '0x1111111111111111111111111111111111111111111111111111111111111111',
      transactionIndex: '0',
      logIndex: '0',
      address: '0x1234567890123456789012345678901234567890',
      eventName: 'Transfer',
      topics: ['0x1234567890abcdef'],
      data: '0x0000000000000000000000000000000000000000000000000000000000000001'
    }];
    
    const result = await DatabaseService.storeEvents(mockEvents, testContract.id, 'sepolia');
    console.log('✅ Events stored:', result.count);
    
    // Clean up
    console.log('Cleaning up test data...');
    // Note: We'll leave the data for inspection
    
    console.log('🎉 Database storage test passed!');
    
  } catch (error) {
    console.error('❌ Database storage test failed:', error);
    if (error.message) console.error('Error message:', error.message);
    if (error.stack) console.error('Stack trace:', error.stack);
    process.exit(1);
  }
}

testEventStorage();
