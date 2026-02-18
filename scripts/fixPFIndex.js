/**
 * Script to fix the duplicate key error in TempPF collection
 * Run this script to remove the unique index from the email field
 * 
 * Usage: node scripts/fixPFIndex.js
 * 
 * Or you can run this directly in MongoDB shell:
 * db.temppfs.dropIndex("email_1")
 */

const mongoose = require('mongoose');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/OfferDB';

async function fixPFIndex() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGO_URI);
    console.log('Connected successfully!');

    const db = mongoose.connection.db;
    const collection = db.collection('temppfs');

    // Get all indexes on the collection
    console.log('\nCurrent indexes on temppfs collection:');
    const indexes = await collection.indexes();
    console.log(JSON.stringify(indexes, null, 2));

    // Check if email_1 index exists
    const emailIndex = indexes.find(idx => idx.key && idx.key.email === 1);
    
    if (emailIndex) {
      console.log(`\nFound email unique index: ${emailIndex.name}`);
      
      // Drop the unique index
      console.log('Dropping the unique index on email...');
      await collection.dropIndex(emailIndex.name);
      console.log('Index dropped successfully!');
      
      // Verify the index is removed
      console.log('\nUpdated indexes on temppfs collection:');
      const updatedIndexes = await collection.indexes();
      console.log(JSON.stringify(updatedIndexes, null, 2));
    } else {
      console.log('\nNo unique index on email field found. No action needed.');
    }

    console.log('\n✅ Fix completed successfully!');
    
  } catch (error) {
    if (error.message.includes('index not found')) {
      console.log('\n✅ Index already removed or does not exist.');
    } else {
      console.error('\n❌ Error:', error.message);
    }
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB.');
    process.exit(0);
  }
}

fixPFIndex();
