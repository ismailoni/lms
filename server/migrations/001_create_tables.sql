-- Create PostgreSQL tables to replace DynamoDB structure

-- Create enum types
CREATE TYPE course_level AS ENUM ('Beginner', 'Intermediate', 'Advanced');
CREATE TYPE course_status AS ENUM ('Draft', 'Published');
CREATE TYPE chapter_type AS ENUM ('Text', 'Quiz', 'Video');
CREATE TYPE payment_provider AS ENUM ('stripe');

-- Main courses table
CREATE TABLE courses (
    "courseId" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "teacherId" VARCHAR(255) NOT NULL,
    "teacherName" VARCHAR(255) NOT NULL,
    "teacherImage" TEXT,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(255) NOT NULL,
    image TEXT,
    price DECIMAL(10,2),
    level course_level NOT NULL,
    status course_status NOT NULL,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Sections table
CREATE TABLE sections (
    "sectionId" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "sectionTitle" VARCHAR(255) NOT NULL,
    "sectionDescription" TEXT,
    "courseId" UUID NOT NULL REFERENCES courses("courseId") ON DELETE CASCADE
);

-- Chapters table
CREATE TABLE chapters (
    "chapterId" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    type chapter_type NOT NULL,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    video TEXT,
    "sectionId" UUID NOT NULL REFERENCES sections("sectionId") ON DELETE CASCADE
);

-- Comments table
CREATE TABLE comments (
    "commentId" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "userId" VARCHAR(255) NOT NULL,
    text TEXT NOT NULL,
    timestamp VARCHAR(255) NOT NULL,
    "chapterId" UUID NOT NULL REFERENCES chapters("chapterId") ON DELETE CASCADE
);

-- Enrollments table
CREATE TABLE enrollments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "userId" VARCHAR(255) NOT NULL,
    "courseId" UUID NOT NULL REFERENCES courses("courseId") ON DELETE CASCADE,
    UNIQUE("userId", "courseId")
);

-- User course progress table
CREATE TABLE user_course_progress (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "userId" VARCHAR(255) NOT NULL,
    "courseId" UUID NOT NULL REFERENCES courses("courseId") ON DELETE CASCADE,
    "enrollmentDate" VARCHAR(255) NOT NULL,
    "overallProgress" DECIMAL(5,2) NOT NULL,
    "lastAccessedTimestamp" VARCHAR(255) NOT NULL,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE("userId", "courseId")
);

-- Section progress table
CREATE TABLE section_progress (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "sectionId" UUID NOT NULL,
    "userCourseProgressId" UUID NOT NULL REFERENCES user_course_progress(id) ON DELETE CASCADE,
    UNIQUE("sectionId", "userCourseProgressId")
);

-- Chapter progress table  
CREATE TABLE chapter_progress (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "chapterId" UUID NOT NULL REFERENCES chapters("chapterId") ON DELETE CASCADE,
    completed BOOLEAN NOT NULL DEFAULT FALSE,
    "sectionProgressId" UUID NOT NULL REFERENCES section_progress(id) ON DELETE CASCADE,
    UNIQUE("chapterId", "sectionProgressId")
);

-- Transactions table
CREATE TABLE transactions (
    "transactionId" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "userId" VARCHAR(255) NOT NULL,
    "dateTime" VARCHAR(255) NOT NULL,
    "courseId" UUID NOT NULL REFERENCES courses("courseId"),
    "paymentProvider" payment_provider NOT NULL,
    amount DECIMAL(10,2),
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Teacher earnings table
CREATE TABLE teacher_earnings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "teacherId" VARCHAR(255) NOT NULL,
    "courseId" UUID NOT NULL REFERENCES courses("courseId"),
    title VARCHAR(255),
    "enrollCount" INTEGER,
    earnings DECIMAL(10,2),
    "updatedAt" VARCHAR(255),
    UNIQUE("teacherId", "courseId")
);

-- Create indexes for better performance
CREATE INDEX idx_courses_teacher_id ON courses("teacherId");
CREATE INDEX idx_courses_category ON courses(category);
CREATE INDEX idx_courses_status ON courses(status);
CREATE INDEX idx_sections_course_id ON sections("courseId");
CREATE INDEX idx_chapters_section_id ON chapters("sectionId");
CREATE INDEX idx_comments_chapter_id ON comments("chapterId");
CREATE INDEX idx_enrollments_user_id ON enrollments("userId");
CREATE INDEX idx_enrollments_course_id ON enrollments("courseId");
CREATE INDEX idx_user_course_progress_user_id ON user_course_progress("userId");
CREATE INDEX idx_user_course_progress_course_id ON user_course_progress("courseId");
CREATE INDEX idx_transactions_user_id ON transactions("userId");
CREATE INDEX idx_transactions_course_id ON transactions("courseId");
CREATE INDEX idx_teacher_earnings_teacher_id ON teacher_earnings("teacherId");