import {
  DynamoDBClient,
  DeleteTableCommand,
  ListTablesCommand,
} from "@aws-sdk/client-dynamodb";
import fs from "fs";
import path from "path";
import dynamoose from "dynamoose";
import pluralize from "pluralize";
import Transaction from "../models/transactionModel";
import Course from "../models/courseModel";
import UserCourseProgress from "../models/userCourseProgressModel";
import TeacherEarnings from "../models/teacherEarningsModel";
import dotenv from "dotenv";

dotenv.config();
let client: DynamoDBClient;

const isProduction = process.env.NODE_ENV === "production";

if (!isProduction) {
  dynamoose.aws.ddb.local();
  client = new DynamoDBClient({
    endpoint: "http://localhost:8000",
    region: "us-east-2",
    credentials: {
      accessKeyId: "dummyKey123",
      secretAccessKey: "dummyKey123",
    },
  });
} else {
  client = new DynamoDBClient({
    region: process.env.AWS_REGION || "us-east-2",
  });
}

const originalWarn = console.warn.bind(console);
console.warn = (message, ...args) => {
  if (!message.includes("Tagging is not currently supported in DynamoDB Local")) {
    originalWarn(message, ...args);
  }
};

async function createTables() {
  const models = [Transaction, UserCourseProgress, Course, TeacherEarnings];
  for (const model of models) {
    const tableName = model.name;
    const table = new dynamoose.Table(tableName, [model], {
      create: true,
      update: true,
      waitForActive: true,
      throughput: { read: 5, write: 5 },
    });

    try {
      await new Promise((resolve) => setTimeout(resolve, 2000));
      await table.initialize();
      console.log(`✅ Table ready: ${tableName}`);
    } catch (error: any) {
      console.error(`❌ Failed to create ${tableName}:`, error.message);
    }
  }
}

async function seedData(tableName: string, filePath: string) {
  const data: { [key: string]: any }[] = JSON.parse(fs.readFileSync(filePath, "utf8"));
  const formattedTableName = pluralize.singular(tableName.charAt(0).toUpperCase() + tableName.slice(1));

  console.log(`🌱 Seeding ${formattedTableName} from ${tableName}.json (${data.length} items)`);

  for (const item of data) {
    try {
      await dynamoose.model(formattedTableName).create(item);
      console.log(`  ➕ Inserted ${formattedTableName} key= ${item.teacherId || item.userId || item.courseId}`);
    } catch (err) {
      console.error(`❌ Error inserting into ${formattedTableName}:`, err);
    }
  }
}

async function generateTeacherEarnings() {
  console.log("💰 Generating TeacherEarnings from Courses table…");
  const courses = await Course.scan().exec();

  for (const course of courses) {
    const enrollCount = Array.isArray(course.enrollments) ? course.enrollments.length : 0;
    const earnings = (course.price ?? 0) * enrollCount;

    const teacherEarning = {
      teacherId: course.teacherId,
      courseId: course.courseId,
      title: course.title,
      enrollCount,
      earnings,
      updatedAt: new Date().toISOString(),
    };

    try {
      await TeacherEarnings.create(teacherEarning);
      console.log(`  💸 Inserted earnings for course: ${course.title}`);
    } catch (err) {
      console.error(`❌ Error inserting TeacherEarnings for ${course.title}:`, err);
    }
  }

  console.log("✅ Finished generating TeacherEarnings from courses");
}

async function deleteTable(baseTableName: string) {
  const deleteCommand = new DeleteTableCommand({ TableName: baseTableName });
  try {
    await client.send(deleteCommand);
    console.log(`🗑 Deleted table: ${baseTableName}`);
  } catch (err: any) {
    if (err.name === "ResourceNotFoundException") {
      console.log(`⚠️ Table does not exist: ${baseTableName}`);
    } else {
      console.error(`❌ Error deleting ${baseTableName}:`, err);
    }
  }
}

async function deleteAllTables() {
  const listTablesCommand = new ListTablesCommand({});
  const { TableNames } = await client.send(listTablesCommand);

  if (TableNames && TableNames.length > 0) {
    for (const tableName of TableNames) {
      await deleteTable(tableName);
      await new Promise((resolve) => setTimeout(resolve, 800));
    }
  }
}

export default async function seed() {
  console.log("🔔 Starting seed script…");
  await deleteAllTables();
  await new Promise((resolve) => setTimeout(resolve, 1000));

  await createTables();

  const dataDir = path.join(__dirname, "./data");
  const files = fs.readdirSync(dataDir).filter((f) => f.endsWith(".json"));

  for (const file of files) {
    const tableName = path.basename(file, ".json");
    const filePath = path.join(dataDir, file);

    // Skip teacherEarnings.json since we will auto-generate
    if (tableName === "teacherEarnings") continue;

    await seedData(tableName, filePath);
  }

  await generateTeacherEarnings();
  console.log("🎉 Seed script finished.");
}

if (require.main === module) {
  seed().catch((error) => {
    console.error("❌ Failed to run seed script:", error);
  });
}
