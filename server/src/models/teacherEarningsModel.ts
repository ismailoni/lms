import { Schema, model } from "dynamoose";

const teacherEarningsSchema = new Schema(
  {
    teacherId: {
      type: String,
      hashKey: true,
      required: true,
    },
    courseId: {
      type: String,
      rangeKey: true,
      required: true,
    },
    title: String,
    enrollCount: Number,
    earnings: Number,
    updatedAt: String,
  },
  {
    timestamps: false,
  }
);

const TeacherEarnings = model("TeacherEarnings", teacherEarningsSchema);

export default TeacherEarnings;
