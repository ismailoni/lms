import { Schema, model } from "dynamoose";

const teacherEarningsSchema = new Schema(
  {
    teacherId: {
      type: String,
      hashKey: true,        // partition key
      required: true,
    },
    courseId: {
      type: String,
      rangeKey: true,       // sort key, so one record per teacher+course
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    enrollCount: {
      type: Number,
      required: true,
    },
    earnings: {
      type: Number,
      required: true,
    },
    updatedAt: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: false,
  }
);

const TeacherEarnings = model("TeacherEarnings", teacherEarningsSchema);

export default TeacherEarnings;
