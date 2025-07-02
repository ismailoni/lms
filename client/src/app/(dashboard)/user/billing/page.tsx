// front-end/src/components/TeacherEarnings.tsx
'use client';

import React from "react";
import Loading from "@/components/Loading";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatPrice } from "@/lib/utils";
import { useGetTeacherEarningsBreakdownQuery } from "@/state/api";
import { useUser } from "@clerk/nextjs";

const TeacherEarnings = () => {
  const { user, isLoaded } = useUser();
  const teacherId = user?.id || "";

  const { data, isLoading, error } = useGetTeacherEarningsBreakdownQuery(teacherId, {
    skip: !isLoaded || !teacherId,
  });

  if (!isLoaded) return <Loading />;
  if (!user) return <div>Please sign in to view your earnings</div>;
  if (isLoading) return <Loading />;
  if (error) return <div>Oops! Couldn’t load your earnings.</div>;

  return (
    <div className="teacher-earnings">
      <h2 className="mb-4 text-2xl font-semibold">Earnings by Course</h2>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Course</TableHead>
            <TableHead>Enrolled Users</TableHead>
            <TableHead>Earnings</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.breakdown.map(({ courseId, title, enrollCount, earnings }) => (
            <TableRow key={courseId}>
              <TableCell>{title}</TableCell>
              <TableCell>{enrollCount}</TableCell>
              <TableCell>{formatPrice(earnings)}</TableCell>
            </TableRow>
          ))}

          {/* Footer row for total earnings */}
          <TableRow className="font-bold">
            <TableCell>Total</TableCell>
            <TableCell />
            <TableCell>{formatPrice(data.totalEarnings)}</TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </div>
  );
};

export default TeacherEarnings;
