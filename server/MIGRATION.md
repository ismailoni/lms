# PostgreSQL Migration Guide

This document explains the migration from DynamoDB to PostgreSQL for the LMS backend.

## Overview

The LMS backend has been migrated from DynamoDB (NoSQL) to PostgreSQL (SQL) to provide:
- Better relational data modeling
- Improved query capabilities
- Enhanced data consistency
- Easier deployment on platforms like Render

## Database Schema

The new PostgreSQL schema includes the following tables:

### Core Tables
- `courses` - Course information (title, description, teacher, etc.)
- `sections` - Course sections (belongs to courses)
- `chapters` - Chapter content (belongs to sections)
- `comments` - Chapter comments (belongs to chapters)
- `enrollments` - User course enrollments

### Progress Tracking
- `user_course_progress` - Overall user progress per course
- `section_progress` - Progress per section
- `chapter_progress` - Progress per individual chapter

### Business Logic
- `transactions` - Payment and enrollment transactions
- `teacher_earnings` - Teacher earnings tracking per course

## Environment Variables

Update your `.env` file with the following PostgreSQL configuration:

```
DATABASE_URL=postgresql://username:password@host:port/database
```

For Render PostgreSQL, the format is:
```
DATABASE_URL=postgresql://user:password@dpg-xxxxx-a.oregon-postgres.render.com/database_name
```

## Running Migrations

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Run database migrations:**
   ```bash
   npm run db:migrate
   ```

3. **Seed the database with sample data:**
   ```bash
   npm run seed
   ```

4. **Test the migration:**
   ```bash
   npm run test-migration
   ```

## API Compatibility

The migration maintains API compatibility. All existing endpoints continue to work with the same request/response formats:

- `GET /courses` - List courses
- `GET /courses/:courseId` - Get course details
- `POST /courses` - Create course
- `PUT /courses/:courseId` - Update course
- `DELETE /courses/:courseId` - Delete course
- `GET /transactions` - List transactions
- `POST /transactions` - Create transaction
- `GET /teachers/:teacherId/earnings` - Get teacher earnings
- `GET /users/:userId/progress/:courseId` - Get user progress
- `PUT /users/:userId/progress/:courseId` - Update user progress

## Model Changes

### Before (DynamoDB)
- Nested JSON documents for sections/chapters
- Hash/Range key structure
- Dynamoose ORM

### After (PostgreSQL)
- Normalized relational tables
- Foreign key relationships
- Raw SQL queries with pg driver

## Key Differences

1. **Data Structure**: Nested data (sections/chapters) is now in separate tables with foreign key relationships
2. **Queries**: Complex joins replace simple document queries
3. **Transactions**: ACID transactions ensure data consistency
4. **IDs**: UUIDs are used for primary keys to maintain compatibility

## Deployment

For production deployment on Render:

1. Create a PostgreSQL database on Render
2. Set the `DATABASE_URL` environment variable
3. Run migrations on first deployment
4. Seed with production data if needed

## Troubleshooting

- **Connection Issues**: Verify `DATABASE_URL` format and network access
- **Migration Errors**: Check PostgreSQL version compatibility (requires 12+)
- **Performance**: Add indexes as needed for your query patterns
- **Data Types**: Ensure proper type conversion from DynamoDB to PostgreSQL