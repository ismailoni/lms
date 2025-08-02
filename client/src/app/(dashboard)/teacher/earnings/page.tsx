'use client';

import React, { useState, useMemo } from "react";
import {
  Card,
  CardContent,
  CardDescription,
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
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
} from "recharts";
import {
  DollarSign,
  BookOpen,
  Users,
  TrendingUp,
  Calendar,
  Filter,
  Download,
  BarChart3,
  PieChart as PieChartIcon,
  LineChart as LineChartIcon,
  AlertCircle,
  Award,
  Target,
  ArrowUpRight,
  ArrowDownRight,
  Eye,
  Sparkles,
  Info,
  AreaChartIcon
} from "lucide-react";

const CHART_COLORS = ['#60A5FA', '#34D399', '#FBBF24', '#F87171', '#A78BFA', '#22D3EE'];

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, type: "spring", stiffness: 100 },
  }),
};

const TeacherEarningsDashboard = () => {
  const { user, isLoaded } = useUser();
  const teacherId = user?.id || "";

  const [selectedCategory, setSelectedCategory] = useState("all");
  const [dateRange, setDateRange] = useState("30");
  const [chartType, setChartType] = useState<'line' | 'bar' | 'area'>('area');
  const [activeTab, setActiveTab] = useState("overview");

  const { data, isLoading, error } = useGetTeacherEarningsBreakdownQuery(
    teacherId,
    { skip: !isLoaded || !teacherId }
  );

  // Enhanced calculations
  const stats = useMemo(() => {
    if (!data?.breakdown) return null;

    const totalEarnings = data.totalEarnings || 0;
    const totalCourses = data.breakdown.length;
    const totalEnrollments = data.breakdown.reduce((sum, c) => sum + c.enrollCount, 0);
    const avgEarningsPerCourse = totalCourses > 0 ? totalEarnings / totalCourses : 0;
    const avgEarningsPerStudent = totalEnrollments > 0 ? totalEarnings / totalEnrollments : 0;
    
    // Find top performing course
    const topCourse = data.breakdown.reduce((top, course) => 
      course.earnings > top.earnings ? course : top, 
      data.breakdown[0] || { earnings: 0, title: 'N/A' }
    );

    // Calculate growth (mock data - you'd want real historical data)
    const mockGrowth = 12.5; // This should come from comparing with previous period

    return {
      totalEarnings,
      totalCourses,
      totalEnrollments,
      avgEarningsPerCourse,
      avgEarningsPerStudent,
      topCourse,
      growth: mockGrowth
    };
  }, [data]);

  // Filter and prepare chart data
  const chartData = useMemo(() => {
    if (!data?.breakdown) return [];
    
    let filtered = data.breakdown;
    if (selectedCategory !== "all") {
      filtered = data.breakdown.filter(course => course.courseId === selectedCategory);
    }

    return filtered.map((course, index) => ({
      name: course.title.length > 20 ? course.title.substring(0, 20) + '...' : course.title,
      fullName: course.title,
      earnings: course.earnings,
      enrollments: course.enrollCount,
      avgPerStudent: course.enrollCount > 0 ? course.earnings / course.enrollCount : 0,
      fill: CHART_COLORS[index % CHART_COLORS.length]
    }));
  }, [data, selectedCategory]);

  // Enhanced loading states
  if (!isLoaded || isLoading) {
    return (
      <div className="min-h-screen bg-gray-900 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-800 rounded w-1/3"></div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="h-32 bg-gray-800 rounded-lg"></div>
              ))}
            </div>
            <div className="h-96 bg-gray-800 rounded-lg"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <Alert className="max-w-md bg-gray-800 border-gray-700">
          <AlertCircle className="h-4 w-4 text-gray-300" />
          <AlertDescription className="text-gray-300">
            Please sign in to view your earnings dashboard.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <Alert className="max-w-md bg-red-900/50 border-red-700" variant="destructive">
          <AlertCircle className="h-4 w-4 text-red-300" />
          <AlertDescription className="text-red-300">
            Failed to load earnings data. Please try again later.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const renderChart = () => {
    const commonProps = {
      width: 800,
      height: 300,
      data: chartData,
    };

    switch (chartType) {
      case 'line':
        return (
          <LineChart {...commonProps}>
            <XAxis 
              dataKey="name" 
              tick={{ fill: '#9CA3AF', fontSize: 12 }}
              axisLine={{ stroke: '#374151' }}
            />
            <YAxis 
              tickFormatter={(val) => `$${val}`} 
              tick={{ fill: '#9CA3AF', fontSize: 12 }}
              axisLine={{ stroke: '#374151' }}
            />
            <Tooltip 
              formatter={(val: number | string, name: string) => [
                formatPrice(typeof val === "number" ? val : Number(val)),
                name === 'earnings' ? 'Earnings' : name
              ]}
              labelFormatter={(label) => chartData.find(d => d.name === label)?.fullName || label}
              contentStyle={{
                backgroundColor: '#1F2937',
                border: '1px solid #374151',
                borderRadius: '8px',
                color: '#F3F4F6'
              }}
            />
            <Line 
              type="monotone" 
              dataKey="earnings" 
              stroke="#60A5FA" 
              strokeWidth={3}
              dot={{ fill: '#60A5FA', strokeWidth: 2, r: 4 }}
            />
          </LineChart>
        );
      case 'bar':
        return (
          <BarChart {...commonProps}>
            <XAxis 
              dataKey="name" 
              tick={{ fill: '#9CA3AF', fontSize: 12 }}
              axisLine={{ stroke: '#374151' }}
            />
            <YAxis 
              tickFormatter={(val) => `$${val}`} 
              tick={{ fill: '#9CA3AF', fontSize: 12 }}
              axisLine={{ stroke: '#374151' }}
            />
            <Tooltip 
              formatter={(val: number | string) => [formatPrice(typeof val === "number" ? val : Number(val)), 'Earnings']}
              labelFormatter={(label) => chartData.find(d => d.name === label)?.fullName || label}
              contentStyle={{
                backgroundColor: '#1F2937',
                border: '1px solid #374151',
                borderRadius: '8px',
                color: '#F3F4F6'
              }}
            />
            <Bar dataKey="earnings" fill="#60A5FA" radius={[4, 4, 0, 0]} />
          </BarChart>
        );
      case 'area':
      default:
        return (
          <AreaChart {...commonProps}>
            <XAxis 
              dataKey="name" 
              tick={{ fill: '#9CA3AF', fontSize: 12 }}
              axisLine={{ stroke: '#374151' }}
            />
            <YAxis 
              tickFormatter={(val) => `$${val}`} 
              tick={{ fill: '#9CA3AF', fontSize: 12 }}
              axisLine={{ stroke: '#374151' }}
            />
            <Tooltip 
              formatter={(val: number | string) => [formatPrice(typeof val === "number" ? val : Number(val)), 'Earnings']}
              labelFormatter={(label) => chartData.find(d => d.name === label)?.fullName || label}
              contentStyle={{
                backgroundColor: '#1F2937',
                border: '1px solid #374151',
                borderRadius: '8px',
                color: '#F3F4F6'
              }}
            />
            <Area 
              type="monotone" 
              dataKey="earnings" 
              stroke="#60A5FA" 
              fill="url(#earningsGradient)"
              strokeWidth={2}
            />
            <defs>
              <linearGradient id="earningsGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#60A5FA" stopOpacity={0.4}/>
                <stop offset="95%" stopColor="#60A5FA" stopOpacity={0.1}/>
              </linearGradient>
            </defs>
          </AreaChart>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Enhanced Header */}
      <div className="bg-gray-800 border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-100 flex items-center gap-3">
                <DollarSign className="w-8 h-8 text-green-400" />
                Earnings Dashboard
              </h1>
              <p className="text-gray-400 mt-1">
                Track your teaching performance and revenue
              </p>
            </div>
            
            <div className="flex items-center gap-3">
              <Button variant="outline" className="gap-2 border-gray-600 bg-gray-800 text-gray-300 hover:bg-gray-700">
                <Download className="w-4 h-4" />
                Export Report
              </Button>
              <Button className="gap-2 bg-blue-600 hover:bg-blue-700">
                <Eye className="w-4 h-4" />
                View Analytics
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6 space-y-8">
        {/* Enhanced Filters */}
        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="p-6">
            <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-gray-400" />
                  <Select value={dateRange} onValueChange={setDateRange}>
                    <SelectTrigger className="w-40 bg-gray-700 border-gray-600 text-gray-300">
                      <SelectValue placeholder="Select period" />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-800 border-gray-700">
                      <SelectItem value="7" className="text-gray-300 focus:bg-gray-700">Last 7 days</SelectItem>
                      <SelectItem value="30" className="text-gray-300 focus:bg-gray-700">Last 30 days</SelectItem>
                      <SelectItem value="90" className="text-gray-300 focus:bg-gray-700">Last 90 days</SelectItem>
                      <SelectItem value="365" className="text-gray-300 focus:bg-gray-700">Last year</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center gap-2">
                  <Filter className="w-4 h-4 text-gray-400" />
                  <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                    <SelectTrigger className="w-48 bg-gray-700 border-gray-600 text-gray-300">
                      <SelectValue placeholder="Filter by course" />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-800 border-gray-700">
                      <SelectItem value="all" className="text-gray-300 focus:bg-gray-700">All Courses</SelectItem>
                      {data?.breakdown?.map((course) => (
                        <SelectItem key={course.courseId} value={course.courseId} className="text-gray-300 focus:bg-gray-700">
                          {course.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Chart Type Selector */}
              <div className="flex items-center gap-1 bg-gray-700 rounded-lg p-1">
                <Button
                  variant={chartType === 'area' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setChartType('area')}
                  className={`gap-1 ${chartType === 'area' ? 'bg-blue-600 text-white' : 'text-gray-300 hover:bg-gray-600'}`}
                >
                  <AreaChartIcon className="w-4 h-4" />
                </Button>
                <Button
                  variant={chartType === 'line' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setChartType('line')}
                  className={`gap-1 ${chartType === 'line' ? 'bg-blue-600 text-white' : 'text-gray-300 hover:bg-gray-600'}`}
                >
                  <LineChartIcon className="w-4 h-4" />
                </Button>
                <Button
                  variant={chartType === 'bar' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setChartType('bar')}
                  className={`gap-1 ${chartType === 'bar' ? 'bg-blue-600 text-white' : 'text-gray-300 hover:bg-gray-600'}`}
                >
                  <BarChart3 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Enhanced Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            {
              title: 'Total Earnings',
              value: formatPrice(stats?.totalEarnings),
              icon: DollarSign,
              color: 'text-green-400',
              bgColor: 'bg-green-900/30',
              change: stats?.growth ? `+${stats.growth}%` : null,
              trend: 'up'
            },
            {
              title: 'Active Courses',
              value: stats?.totalCourses || 0,
              icon: BookOpen,
              color: 'text-blue-400',
              bgColor: 'bg-blue-900/30',
              change: null,
              trend: null
            },
            {
              title: 'Total Students',
              value: stats?.totalEnrollments || 0,
              icon: Users,
              color: 'text-purple-400',
              bgColor: 'bg-purple-900/30',
              change: null,
              trend: null
            },
            {
              title: 'Avg per Student',
              value: formatPrice(stats?.avgEarningsPerStudent),
              icon: Target,
              color: 'text-orange-400',
              bgColor: 'bg-orange-900/30',
              change: null,
              trend: null
            },
          ].map((stat, index) => (
            <motion.div
              key={stat.title}
              custom={index}
              initial="hidden"
              animate="visible"
              variants={cardVariants}
            >
              <Card className="bg-gray-800 border-gray-700 hover:shadow-xl transition-shadow duration-200">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-400 mb-1">
                        {stat.title}
                      </p>
                      <p className="text-2xl font-bold text-gray-100">
                        {stat.value}
                      </p>
                      {stat.change && (
                        <div className="flex items-center gap-1 mt-1">
                          {stat.trend === 'up' ? (
                            <ArrowUpRight className="w-3 h-3 text-green-400" />
                          ) : (
                            <ArrowDownRight className="w-3 h-3 text-red-400" />
                          )}
                          <span className={`text-xs ${stat.trend === 'up' ? 'text-green-400' : 'text-red-400'}`}>
                            {stat.change}
                          </span>
                        </div>
                      )}
                    </div>
                    <div className={`p-3 rounded-lg ${stat.bgColor}`}>
                      <stat.icon className={`w-6 h-6 ${stat.color}`} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Top Course Highlight */}
        {stats?.topCourse && (
          <Card className="bg-gradient-to-r from-yellow-900/20 to-orange-900/20 border-yellow-700/50">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-yellow-900/40 rounded-lg">
                  <Award className="w-5 h-5 text-yellow-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-100">
                    Top Performing Course
                  </h3>
                  <p className="text-sm text-gray-400">
                    <span className="font-medium text-gray-300">{stats.topCourse.title}</span> - {formatPrice(stats.topCourse.earnings)} earned
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 bg-gray-800 border-gray-700">
            <TabsTrigger value="overview" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white text-gray-300">Overview</TabsTrigger>
            <TabsTrigger value="analytics" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white text-gray-300">Analytics</TabsTrigger>
            <TabsTrigger value="courses" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white text-gray-300">Course Details</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* Enhanced Chart */}
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2 text-gray-100">
                      <TrendingUp className="w-5 h-5 text-blue-400" />
                      Earnings Trend
                    </CardTitle>
                    <CardDescription className="text-gray-400">
                      Your earnings performance over time
                    </CardDescription>
                  </div>
                  <Badge variant="outline" className="gap-1 border-gray-600 text-gray-300">
                    <Sparkles className="w-3 h-3" />
                    {chartType.charAt(0).toUpperCase() + chartType.slice(1)} Chart
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                  {renderChart()}
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Pie Chart */}
              <Card className="bg-gray-800 border-gray-700">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-gray-100">
                    <PieChartIcon className="w-5 h-5 text-blue-400" />
                    Revenue Distribution
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={chartData}
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        dataKey="earnings"
                        label={({name, percent}) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}
                      >
                        {chartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.fill} />
                        ))}
                      </Pie>
                      <Tooltip 
                        formatter={(val: number | string) => [formatPrice(Number(val)), 'Earnings']} 
                        contentStyle={{
                          backgroundColor: '#1F2937',
                          border: '1px solid #374151',
                          borderRadius: '8px',
                          color: '#F3F4F6'
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Performance Metrics */}
              <Card className="bg-gray-800 border-gray-700">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-gray-100">
                    <Target className="w-5 h-5 text-blue-400" />
                    Performance Metrics
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-300">Course Completion Rate</span>
                      <span className="text-gray-300">87%</span>
                    </div>
                    <Progress value={87} className="h-2 bg-gray-700" />
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-300">Student Satisfaction</span>
                      <span className="text-gray-300">94%</span>
                    </div>
                    <Progress value={94} className="h-2 bg-gray-700" />
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-300">Revenue Goal</span>
                      <span className="text-gray-300">76%</span>
                    </div>
                    <Progress value={76} className="h-2 bg-gray-700" />
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="courses" className="space-y-6">
            {/* Enhanced Table */}
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-gray-100">
                  <BookOpen className="w-5 h-5 text-blue-400" />
                  Course Performance
                </CardTitle>
                <CardDescription className="text-gray-400">
                  Detailed breakdown of earnings by course
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-gray-700">
                        <TableHead className="text-gray-300">Course</TableHead>
                        <TableHead className="text-center text-gray-300">Students</TableHead>
                        <TableHead className="text-center text-gray-300">Avg/Student</TableHead>
                        <TableHead className="text-right text-gray-300">Total Earnings</TableHead>
                        <TableHead className="text-center text-gray-300">Performance</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {data?.breakdown?.map((course) => {
                        const avgPerStudent = course.enrollCount > 0 ? course.earnings / course.enrollCount : 0;
                        const performance = course.earnings / (stats?.totalEarnings || 1) * 100;
                        
                        return (
                          <TableRow key={course.courseId} className="border-gray-700 hover:bg-gray-700/50">
                            <TableCell className="font-medium text-gray-200">
                              <div>
                                <p className="font-semibold">{course.title}</p>
                                <p className="text-xs text-gray-400">ID: {course.courseId.slice(0, 8)}</p>
                              </div>
                            </TableCell>
                            <TableCell className="text-center">
                              <Badge variant="secondary" className="bg-gray-700 text-gray-300">
                                {course.enrollCount}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-center text-gray-300">
                              {formatPrice(avgPerStudent)}
                            </TableCell>
                            <TableCell className="text-right font-semibold text-gray-200">
                              {formatPrice(course.earnings)}
                            </TableCell>
                            <TableCell className="text-center">
                              <div className="flex items-center gap-2">
                                <Progress value={performance} className="h-2 flex-1 bg-gray-700" />
                                <span className="text-xs w-10 text-gray-300">{performance.toFixed(0)}%</span>
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                      
                      {/* Enhanced Total Row */}
                      <TableRow className="font-bold border-t-2 border-gray-600 bg-gray-700/50">
                        <TableCell className="text-gray-200">
                          <div className="flex items-center gap-2">
                            <Award className="w-4 h-4 text-yellow-400" />
                            Total
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge className="bg-blue-600 text-white">
                            {stats?.totalEnrollments}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center text-gray-200">
                          {formatPrice(stats?.avgEarningsPerStudent)}
                        </TableCell>
                        <TableCell className="text-right text-lg text-gray-100">
                          {formatPrice(stats?.totalEarnings)}
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge className="bg-green-600 text-white">
                            100%
                          </Badge>
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Insights Card */}
        <Card className="bg-blue-900/20 border-blue-700/50">
          <CardContent className="p-6">
            <div className="flex gap-3">
              <Info className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-medium text-blue-300 mb-2">
                  💡 Earnings Insights
                </h4>
                <ul className="text-sm text-blue-200 space-y-1">
                  <li>• Your top course generates {stats?.topCourse ? formatPrice(stats.topCourse.earnings) : '$0'} in revenue</li>
                  <li>• Average earning per student: {formatPrice(stats?.avgEarningsPerStudent)}</li>
                  <li>• Consider creating more content similar to your top performers</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default TeacherEarningsDashboard;
