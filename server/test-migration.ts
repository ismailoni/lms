#!/usr/bin/env ts-node
import dotenv from 'dotenv';
import db from '../src/utils/database';
import runMigrations from '../src/utils/runMigrations';
import seedPostgreSQL from '../src/seed/seedPostgreSQL';

dotenv.config();

async function testMigration() {
  try {
    console.log('🚀 Testing PostgreSQL migration...');
    
    // Test database connection
    console.log('📡 Testing database connection...');
    const result = await db.query('SELECT NOW()');
    console.log('✅ Database connection successful:', result.rows[0]);
    
    // Test running migrations
    console.log('🗄️ Testing migration runner...');
    await runMigrations();
    console.log('✅ Migrations ran successfully');
    
    // Test seeding
    console.log('🌱 Testing data seeding...');
    await seedPostgreSQL();
    console.log('✅ Data seeded successfully');
    
    // Test basic queries
    console.log('🔍 Testing basic queries...');
    const courses = await db.query('SELECT COUNT(*) as count FROM courses');
    console.log(`✅ Found ${courses.rows[0].count} courses`);
    
    const transactions = await db.query('SELECT COUNT(*) as count FROM transactions');
    console.log(`✅ Found ${transactions.rows[0].count} transactions`);
    
    const userProgress = await db.query('SELECT COUNT(*) as count FROM user_course_progress');
    console.log(`✅ Found ${userProgress.rows[0].count} user course progress records`);
    
    console.log('🎉 All tests passed! PostgreSQL migration is working correctly.');
    
  } catch (error) {
    console.error('❌ Migration test failed:', error);
    process.exit(1);
  } finally {
    await db.end();
    process.exit(0);
  }
}

if (require.main === module) {
  testMigration();
}