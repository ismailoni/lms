"use client";

import React, { useState, useMemo } from "react";
import Loading from "@/components/Loading";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatPrice } from "@/lib/utils";
import { useGetTransactionsQuery } from "@/state/api";
import { useUser } from "@clerk/nextjs";
import { motion } from "framer-motion";
import {
  CreditCard,
  Download,
  Search,
  Filter,
  Calendar,
  DollarSign,
  Receipt,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  Clock,
  RefreshCw,
  FileText,
  Eye,
  Wallet,
  ArrowUpRight,
  ArrowDownRight,
  PieChart,
  BarChart3,
  ExternalLink,
  Plus,
  Settings,
  Shield,
  Info
} from "lucide-react";

const PAYMENT_PROVIDERS = [
  { value: 'all', label: 'All Payment Methods', icon: '💳' },
  { value: 'stripe', label: 'Stripe', icon: '🟣' },
  { value: 'paypal', label: 'PayPal', icon: '🔵' },
  { value: 'apple', label: 'Apple Pay', icon: '🍎' },
  { value: 'google', label: 'Google Pay', icon: '🔴' },
];

const TRANSACTION_STATUSES = [
  { value: 'all', label: 'All Statuses' },
  { value: 'completed', label: 'Completed' },
  { value: 'pending', label: 'Pending' },
  { value: 'failed', label: 'Failed' },
  { value: 'refunded', label: 'Refunded' },
];

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, type: "spring", stiffness: 100 },
  }),
};

const UserBilling = () => {
  const [paymentType, setPaymentType] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [dateRange, setDateRange] = useState("all");
  const [activeTab, setActiveTab] = useState("transactions");

  const { user, isLoaded } = useUser();
  const { data: transactions, isLoading: isLoadingTransactions, refetch } =
    useGetTransactionsQuery(user?.id || "", {
      skip: !isLoaded || !user,
    });

  // Enhanced filtering and calculations
  const { filteredData, stats } = useMemo(() => {
    if (!transactions) return { filteredData: [], stats: null };

    const filtered = transactions.filter((transaction) => {
      const matchesPaymentType =
        paymentType === "all" || transaction.paymentProvider === paymentType;
      
      const matchesStatus = 
        statusFilter === "all" || transaction.status === statusFilter;
      
      const matchesSearch = 
        searchTerm === "" || 
        transaction.courseTitle?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        transaction.transactionId.toLowerCase().includes(searchTerm.toLowerCase());

      // Date filtering
      const transactionDate = new Date(transaction.dateTime);
      const now = new Date();
      let matchesDate = true;
      
      if (dateRange === "7days") {
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        matchesDate = transactionDate >= weekAgo;
      } else if (dateRange === "30days") {
        const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        matchesDate = transactionDate >= monthAgo;
      } else if (dateRange === "90days") {
        const quarterAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        matchesDate = transactionDate >= quarterAgo;
      }

      return matchesPaymentType && matchesStatus && matchesSearch && matchesDate;
    });

    // Sort by date (newest first)
    filtered.sort((a, b) => new Date(b.dateTime).getTime() - new Date(a.dateTime).getTime());

    // Calculate statistics
    const totalSpent = transactions.reduce((sum, t) => sum + t.amount, 0);
    const thisMonthSpent = transactions
      .filter(t => {
        const transactionDate = new Date(t.dateTime);
        const now = new Date();
        return transactionDate.getMonth() === now.getMonth() && 
               transactionDate.getFullYear() === now.getFullYear();
      })
      .reduce((sum, t) => sum + t.amount, 0);

    const completedTransactions = transactions.filter(t => t.status === 'completed' || !t.status).length;
    const avgTransactionAmount = transactions.length > 0 ? totalSpent / transactions.length : 0;

    return {
      filteredData: filtered,
      stats: {
        totalSpent,
        thisMonthSpent,
        totalTransactions: transactions.length,
        completedTransactions,
        avgTransactionAmount,
        pendingTransactions: transactions.filter(t => t.status === 'pending').length,
      }
    };
  }, [transactions, paymentType, statusFilter, searchTerm, dateRange]);

  const getStatusBadge = (status?: string) => {
    switch (status?.toLowerCase()) {
      case 'completed':
        return <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
          <CheckCircle2 className="w-3 h-3 mr-1" />
          Completed
        </Badge>;
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
          <Clock className="w-3 h-3 mr-1" />
          Pending
        </Badge>;
      case 'failed':
        return <Badge className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
          <AlertCircle className="w-3 h-3 mr-1" />
          Failed
        </Badge>;
      case 'refunded':
        return <Badge className="bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200">
          <RefreshCw className="w-3 h-3 mr-1" />
          Refunded
        </Badge>;
      default:
        return <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
          <CheckCircle2 className="w-3 h-3 mr-1" />
          Completed
        </Badge>;
    }
  };

  const getPaymentProviderIcon = (provider: string) => {
    const providerData = PAYMENT_PROVIDERS.find(p => p.value === provider.toLowerCase());
    return providerData?.icon || '💳';
  };

  if (!isLoaded || isLoadingTransactions) {
    return (
      <Loading />
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <Alert className="max-w-md">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Please sign in to view your billing information.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Enhanced Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-3">
                <Wallet className="w-8 h-8 text-primary-600" />
                Billing & Payments
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                Manage your payment history and billing preferences
              </p>
            </div>
            
            <div className="flex items-center gap-3">
              <Button variant="outline" className="gap-2">
                <Download className="w-4 h-4" />
                Export
              </Button>
              <Button variant="outline" className="gap-2">
                <Settings className="w-4 h-4" />
                Settings
              </Button>
              <Button className="gap-2 bg-primary-600 hover:bg-primary-700">
                <Plus className="w-4 h-4" />
                Add Payment Method
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6 space-y-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          {
            title: 'Total Spent',
            value: formatPrice(stats?.totalSpent),
            icon: DollarSign,
            color: 'text-green-600',
            bgColor: 'bg-green-100 dark:bg-green-900/20',
            change: '+12.5%',
            trend: 'up'
          },
          {
            title: 'This Month',
            value: formatPrice(stats?.thisMonthSpent),
            icon: Calendar,
            color: 'text-blue-600',
            bgColor: 'bg-blue-100 dark:bg-blue-900/20',
            change: null,
            trend: null
          },
          {
            title: 'Transactions',
            value: stats?.totalTransactions || 0,
            icon: Receipt,
            color: 'text-purple-600',
            bgColor: 'bg-purple-100 dark:bg-purple-900/20',
            change: null,
            trend: null
          },
          {
            title: 'Avg Amount',
            value: formatPrice(stats?.avgTransactionAmount),
            icon: TrendingUp,
            color: 'text-orange-600',
            bgColor: 'bg-orange-100 dark:bg-orange-900/20',
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
            <Card className="hover:shadow-lg transition-shadow duration-200">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                      {stat.title}
                    </p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                      {stat.value}
                    </p>
                    {stat.change && (
                      <div className="flex items-center gap-1 mt-1">
                        {stat.trend === 'up' ? (
                          <ArrowUpRight className="w-3 h-3 text-green-600" />
                        ) : (
                          <ArrowDownRight className="w-3 h-3 text-red-600" />
                        )}
                        <span className={`text-xs ${stat.trend === 'up' ? 'text-green-600' : 'text-red-600'}`}>
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

        {/* Enhanced Filters */}
        <Card>
          <CardContent className="p-6">
            <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
              {/* Search */}
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search transactions..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>

              <div className="flex items-center gap-3">
                {/* Date Range Filter */}
                <Select value={dateRange} onValueChange={setDateRange}>
                  <SelectTrigger className="w-[140px]">
                    <Calendar className="w-4 h-4 mr-2" />
                    <SelectValue placeholder="Date range" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Time</SelectItem>
                    <SelectItem value="7days">Last 7 days</SelectItem>
                    <SelectItem value="30days">Last 30 days</SelectItem>
                    <SelectItem value="90days">Last 90 days</SelectItem>
                  </SelectContent>
                </Select>

                {/* Payment Type Filter */}
                <Select value={paymentType} onValueChange={setPaymentType}>
                  <SelectTrigger className="w-[180px]">
                    <Filter className="w-4 h-4 mr-2" />
                    <SelectValue placeholder="Payment type" />
                  </SelectTrigger>
                  <SelectContent>
                    {PAYMENT_PROVIDERS.map((provider) => (
                      <SelectItem key={provider.value} value={provider.value}>
                        <span className="flex items-center gap-2">
                          <span>{provider.icon}</span>
                          {provider.label}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {/* Status Filter */}
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[140px]">
                    <CheckCircle2 className="w-4 h-4 mr-2" />
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    {TRANSACTION_STATUSES.map((status) => (
                      <SelectItem key={status.value} value={status.value}>
                        {status.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => refetch()}
                  className="gap-2"
                >
                  <RefreshCw className="w-4 h-4" />
                  Refresh
                </Button>
              </div>
            </div>

            {/* Active Filters */}
            {(searchTerm || paymentType !== 'all' || statusFilter !== 'all' || dateRange !== 'all') && (
              <div className="flex items-center gap-2 mt-4">
                <span className="text-sm text-gray-500">Active filters:</span>
                {searchTerm && (
                  <Badge variant="secondary" className="gap-1">
                    Search: &quot;{searchTerm}&quot;
                    <button onClick={() => setSearchTerm('')} className="ml-1 hover:bg-gray-200 rounded">
                      ×
                    </button>
                  </Badge>
                )}
                {paymentType !== 'all' && (
                  <Badge variant="secondary" className="gap-1">
                    Payment: {PAYMENT_PROVIDERS.find(p => p.value === paymentType)?.label}
                    <button onClick={() => setPaymentType('all')} className="ml-1 hover:bg-gray-200 rounded">
                      ×
                    </button>
                  </Badge>
                )}
                {statusFilter !== 'all' && (
                  <Badge variant="secondary" className="gap-1">
                    Status: {TRANSACTION_STATUSES.find(s => s.value === statusFilter)?.label}
                    <button onClick={() => setStatusFilter('all')} className="ml-1 hover:bg-gray-200 rounded">
                      ×
                    </button>
                  </Badge>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="transactions">Transaction History</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="methods">Payment Methods</TabsTrigger>
          </TabsList>

          <TabsContent value="transactions" className="space-y-6">
            {/* Enhanced Transactions Table */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Receipt className="w-5 h-5 text-primary-600" />
                      Transaction History
                    </CardTitle>
                    <CardDescription>
                      {filteredData.length} transaction{filteredData.length !== 1 ? 's' : ''} found
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" className="gap-2">
                      <Download className="w-4 h-4" />
                      Export CSV
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {filteredData.length > 0 ? (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Transaction</TableHead>
                          <TableHead>Course</TableHead>
                          <TableHead>Date</TableHead>
                          <TableHead className="text-center">Payment Method</TableHead>
                          <TableHead className="text-center">Status</TableHead>
                          <TableHead className="text-right">Amount</TableHead>
                          <TableHead className="text-center">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredData.map((transaction) => (
                          <TableRow
                            key={transaction.transactionId}
                            className="hover:bg-gray-50 dark:hover:bg-gray-800/50"
                          >
                            <TableCell className="font-medium">
                              <div>
                                <p className="font-semibold">#{transaction.transactionId.slice(0, 8)}</p>
                                <p className="text-xs text-gray-500">
                                  {new Date(transaction.dateTime).toLocaleTimeString()}
                                </p>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div>
                                <p className="font-medium">{transaction.courseTitle || 'Course Purchase'}</p>
                                <p className="text-xs text-gray-500">Digital Content</p>
                              </div>
                            </TableCell>
                            <TableCell>
                              {new Date(transaction.dateTime).toLocaleDateString()}
                            </TableCell>
                            <TableCell className="text-center">
                              <div className="flex items-center justify-center gap-2">
                                <span className="text-lg">
                                  {getPaymentProviderIcon(transaction.paymentProvider)}
                                </span>
                                <span className="capitalize">{transaction.paymentProvider}</span>
                              </div>
                            </TableCell>
                            <TableCell className="text-center">
                              {getStatusBadge(transaction.status)}
                            </TableCell>
                            <TableCell className="text-right font-semibold">
                              {formatPrice(transaction.amount)}
                            </TableCell>
                            <TableCell className="text-center">
                              <div className="flex items-center justify-center gap-1">
                                <Button variant="ghost" size="sm" className="gap-1">
                                  <Eye className="w-3 h-3" />
                                  View
                                </Button>
                                <Button variant="ghost" size="sm" className="gap-1">
                                  <FileText className="w-3 h-3" />
                                  Receipt
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Receipt className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                      No transactions found
                    </h3>
                    <p className="text-gray-500 mb-4">
                      {searchTerm || paymentType !== 'all' || statusFilter !== 'all' || dateRange !== 'all'
                        ? "Try adjusting your filters to see more results."
                        : "You haven't made any purchases yet."
                      }
                    </p>
                    {searchTerm || paymentType !== 'all' || statusFilter !== 'all' || dateRange !== 'all' ? (
                      <Button
                        variant="outline"
                        onClick={() => {
                          setSearchTerm('');
                          setPaymentType('all');
                          setStatusFilter('all');
                          setDateRange('all');
                        }}
                      >
                        Clear Filters
                      </Button>
                    ) : (
                      <Button className="gap-2">
                        <ExternalLink className="w-4 h-4" />
                        Browse Courses
                      </Button>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <PieChart className="w-5 h-5 text-primary-600" />
                    Spending by Payment Method
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {PAYMENT_PROVIDERS.slice(1).map((provider) => {
                      const providerTransactions = transactions?.filter(t => 
                        t.paymentProvider.toLowerCase() === provider.value
                      ) || [];
                      const providerTotal = providerTransactions.reduce((sum, t) => sum + t.amount, 0);
                      const percentage = stats?.totalSpent ? (providerTotal / stats.totalSpent) * 100 : 0;
                      
                      return (
                        <div key={provider.value} className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span>{provider.icon}</span>
                            <span>{provider.label}</span>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold">{formatPrice(providerTotal)}</p>
                            <p className="text-xs text-gray-500">{percentage.toFixed(1)}%</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="w-5 h-5 text-primary-600" />
                    Spending Insights
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Info className="w-4 h-4 text-blue-600" />
                      <span className="text-sm font-medium text-blue-900 dark:text-blue-100">
                        Monthly Average
                      </span>
                    </div>
                    <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">
                      {formatPrice(stats?.avgTransactionAmount)}
                    </p>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Completed Transactions</span>
                      <span>{stats?.completedTransactions || 0}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Pending Transactions</span>
                      <span>{stats?.pendingTransactions || 0}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Success Rate</span>
                      <span>
                        {stats?.totalTransactions ? 
                          Math.round((stats.completedTransactions / stats.totalTransactions) * 100) : 0
                        }%
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="methods" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-primary-600" />
                  Payment Methods
                </CardTitle>
                <CardDescription>
                  Manage your saved payment methods
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12">
                  <CreditCard className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                    No payment methods saved
                  </h3>
                  <p className="text-gray-500 mb-4">
                    Add a payment method to make future purchases easier
                  </p>
                  <Button className="gap-2">
                    <Plus className="w-4 h-4" />
                    Add Payment Method
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Security Notice */}
        <Card className="bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800">
          <CardContent className="p-6">
            <div className="flex gap-3">
              <Shield className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-medium text-green-900 dark:text-green-100 mb-2">
                  🔒 Your payments are secure
                </h4>
                <p className="text-sm text-green-800 dark:text-green-200">
                  All transactions are encrypted and processed through secure payment gateways. 
                  We never store your complete payment information.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default UserBilling;