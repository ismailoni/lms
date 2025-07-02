'use client';

import React, { useState } from "react";
import Loading from "@/components/Loading";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatPrice } from "@/lib/utils";
import { useGetTeacherEarningsBreakdownQuery } from "@/state/api";
import { useUser } from "@clerk/nextjs";
import { motion } from "framer-motion";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.2, type: "spring", stiffness: 100 },
  }),
};

const TeacherEarningsDashboard = () => {
  const { user, isLoaded } = useUser();
  const teacherId = user?.id || "";

  const [selectedCategory, setSelectedCategory] = useState("All");
  const [dateRange, setDateRange] = useState("Last 30 days");

  const { data, isLoading, error } = useGetTeacherEarningsBreakdownQuery(
    teacherId,
    { skip: !isLoaded || !teacherId }
  );

  if (!isLoaded || isLoading) return <Loading />;
  if (!user) return <div>Please sign in to view your earnings</div>;
  if (error) return <div>Oops! Couldn’t load your earnings.</div>;

  const totalCourses = data?.breakdown?.length ?? 0;
  const totalEnrollments = data?.breakdown?.reduce(
    (sum, c) => sum + c.enrollCount,
    0
  );

  const chartData = data?.breakdown?.map((course) => ({
    name: course.title,
    earnings: course.earnings,
  })) ?? [];

  return (
    <div className="p-6 space-y-8">
      <h1 className="text-3xl font-bold">Your Earnings Dashboard</h1>

      <div className="flex flex-col sm:flex-row gap-4">
        <select
          value={dateRange}
          onChange={(e) => setDateRange(e.target.value)}
          className="border p-2 rounded-md"
        >
          <option>Last 7 days</option>
          <option>Last 30 days</option>
          <option>Last 90 days</option>
        </select>

        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="border p-2 rounded-md"
        >
          <option>All</option>
          {data?.breakdown.map((c) => (
            <option key={c.courseId}>{c.title}</option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        {[
          { title: 'Total Earnings', value: formatPrice(data?.totalEarnings) },
          { title: 'Courses', value: totalCourses },
          { title: 'Enrolled Users', value: totalEnrollments },
        ].map((card, index) => (
          <motion.div
            key={card.title}
            custom={index}
            initial="hidden"
            animate="visible"
            variants={cardVariants}
          >
            <Card>
              <CardHeader>
                <CardTitle>{card.title}</CardTitle>
              </CardHeader>
              <CardContent className="text-2xl font-semibold">
                {card.value}
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <div className="bg-white rounded-2xl shadow p-4">
        <h2 className="mb-4 text-xl font-semibold">Earnings Trend</h2>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={chartData}>
            <XAxis dataKey="name" />
            <YAxis tickFormatter={(val) => `$${val}`} />
            <Tooltip formatter={(val) => formatPrice(typeof val === "number" ? val : Number(val))} />
            <Line type="monotone" dataKey="earnings" stroke="#4f46e5" strokeWidth={3} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="bg-white rounded-2xl shadow p-4">
        <h2 className="mb-4 text-xl font-semibold">Earnings by Course</h2>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Course</TableHead>
              <TableHead>Enrolled Users</TableHead>
              <TableHead>Earnings</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data?.breakdown.map(
              ({ courseId, title, enrollCount, earnings }) => (
                <TableRow key={courseId}>
                  <TableCell>{title}</TableCell>
                  <TableCell>{enrollCount}</TableCell>
                  <TableCell>{formatPrice(earnings)}</TableCell>
                </TableRow>
              )
            )}
            <TableRow className="font-bold">
              <TableCell>Total</TableCell>
              <TableCell>{totalEnrollments}</TableCell>
              <TableCell>{formatPrice(data?.totalEarnings)}</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default TeacherEarningsDashboard;
