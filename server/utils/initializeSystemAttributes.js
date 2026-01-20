#!/usr/bin/env node

/**
 * One-time initialization script to calculate and store totalMeetingsHosted 
 * system attribute for all existing users
 */

import { recalculateAllUserSystemAttributes } from '../services/userAttributeService.js';
import { connectDB, disconnectDB } from '../config/db.js';

async function initializeSystemAttributes() {
    try {
        console.log('Connecting to database...');
        await connectDB();

        console.log('Recalculating system attributes for all users...');
        const userCount = await recalculateAllUserSystemAttributes();
        
        console.log(`✅ Successfully updated system attributes for ${userCount} users`);
        
        await disconnectDB();
        process.exit(0);
    } catch (error) {
        console.error('❌ Error initializing system attributes:', error);
        process.exit(1);
    }
}

// Add a helper function to create a disconnectDB function if it doesn't exist
async function disconnectDB() {
    const mongoose = await import('mongoose');
    await mongoose.default.disconnect();
}

// Run the script if called directly
if (process.argv[1].includes('initializeSystemAttributes.js')) {
    initializeSystemAttributes();
}

export { initializeSystemAttributes };