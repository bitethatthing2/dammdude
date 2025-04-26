#!/usr/bin/env node

/**
 * @deprecated This script is deprecated and will be removed in a future release.
 * Please use notification-cleanup.js instead, which provides more comprehensive
 * notification testing and management functionality.
 */

// Test script to send a notification
const fetch = require('node-fetch');

console.log('\n⚠️  DEPRECATED: This script is deprecated. Please use notification-cleanup.js instead.');
console.log('Running notification-cleanup.js for you...\n');

// Execute the notification-cleanup.js script
require('./notification-cleanup.js');
