import React, { useState, useMemo } from 'react';
import { 
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, 
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer 
} from 'recharts';
import { 
  TrendingUp, Coins, ShoppingBag, Layers, Filter, CheckCircle2,
  AlertTriangle, Calendar, Award, Briefcase, PlusCircle
} from 'lucide-react';
import { Order, Product } from '../types';

interface ReportsDashboardProps {
  orders: Order[];
  products: Product[];
}

// Warm earthy agricultural theme palettes
const COLORS = [
  '#0f5132', // Deep agricultural emerald
  '#198754', // Medium forest green
  '#20c997', // Fresh farm teal
  '#dfa526', // Moniepoint Gold / Wheat
  '#fd7e14', // Farm sunset orange
  '#6f42c1', // Ibadan lavender
  '#0d6efd', // Clear sky blue
];

export default function ReportsDashboard({ orders, products }: ReportsDashboardProps) {
  // Filter states
  const [statusFilter, setStatusFilter] = useState<'all' | 'verified' | 'pending'>('all');
  const [timeFilter, setTimeFilter] = useState<'all' | 'year' | 'month' | 'custom'>('all');
  
  // Custom date selection state
  const [startDate, setStartDate] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return d.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState<string>(() => {
    return new Date().toISOString().split('T')[0];
  });

  // Filtered orders list
  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      // Status matching
      if (statusFilter === 'verified' && order.paymentStatus !== 'Verified') return false;
      if (statusFilter === 'pending' && order.orderStatus !== 'Pending') return false;
      
      // Time matching
      if (timeFilter === 'year') {
        const orderDate = new Date(order.createdAt);
        const oneYearAgo = new Date();
        oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
        if (orderDate < oneYearAgo) return false;
      } else if (timeFilter === 'month') {
        const orderDate = new Date(order.createdAt);
        const oneMonthAgo = new Date();
        oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
        if (orderDate < oneMonthAgo) return false;
      } else if (timeFilter === 'custom') {
        if (!order.createdAt) return false;
        const orderDate = new Date(order.createdAt);
        if (isNaN(orderDate.getTime())) return false;

        if (startDate) {
          const start = new Date(startDate);
          start.setHours(0, 0, 0, 0);
          if (orderDate < start) return false;
        }
        if (endDate) {
          const end = new Date(endDate);
          end.setHours(23, 59, 59, 999);
          if (orderDate > end) return false;
        }
      }
      return true;
    });
  }, [orders, statusFilter, timeFilter, startDate, endDate]);

  // Aggregate Key Metrics
  const metrics = useMemo(() => {
    let totalRevenue = 0;
    let totalItems = 0;
    let verifiedCount = 0;
    
    filteredOrders.forEach((o) => {
      if (o.paymentStatus === 'Verified') {
        totalRevenue += o.totalPrice;
      }
      totalItems += o.quantity;
      if (o.paymentStatus === 'Verified') {
        verifiedCount++;
      }
    });

    const averageOrderValue = filteredOrders.length > 0 
      ? Math.round((totalRevenue || 1) / (verifiedCount || 1)) 
      : 0;

    return {
      totalRevenue,
      totalOrders: filteredOrders.length,
      totalItems,
      averageOrderValue,
      verifiedCount,
      pendingCount: filteredOrders.filter(o => o.orderStatus === 'Pending').length,
    };
  }, [filteredOrders]);

  // Transform 1: Monthly sales & volume trends
  const monthlyData = useMemo(() => {
    const monthlyGroups: { [key: string]: { month: string; rawMonth: string; revenue: number; volume: number } } = {};
    const monthsName = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    // Prepopulate last 6 calendar months to make graph look consistent
    const today = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const name = `${monthsName[d.getMonth()]} ${String(d.getFullYear()).substring(2)}`;
      monthlyGroups[key] = { month: name, rawMonth: key, revenue: 0, volume: 0 };
    }

    // Accumulate real orders
    filteredOrders.forEach((order) => {
      if (!order.createdAt) return;
      const date = new Date(order.createdAt);
      if (isNaN(date.getTime())) return;

      const year = date.getFullYear();
      const monthIdx = date.getMonth();
      const key = `${year}-${String(monthIdx + 1).padStart(2, '0')}`;
      const name = `${monthsName[monthIdx]} ${String(year).substring(2)}`;

      if (!monthlyGroups[key]) {
        // dynamic addition for older data
        monthlyGroups[key] = { month: name, rawMonth: key, revenue: 0, volume: 0 };
      }

      if (order.paymentStatus === 'Verified') {
        monthlyGroups[key].revenue += order.totalPrice;
      }
      monthlyGroups[key].volume += 1;
    });

    // Sort chronologically
    return Object.values(monthlyGroups).sort((a, b) => a.rawMonth.localeCompare(b.rawMonth));
  }, [filteredOrders]);

  // Transform 2: Popularity by categories
  const categoryData = useMemo(() => {
    const categoryMap: { [key: string]: { name: string; value: number; revenue: number } } = {};

    filteredOrders.forEach((order) => {
      // Normalize category (Pigs, Eggs, Layers, Fish, Broilers, etc.)
      const cat = order.category || 'Other';
      if (!categoryMap[cat]) {
        categoryMap[cat] = { name: cat, value: 0, revenue: 0 };
      }
      categoryMap[cat].value += order.quantity;
      if (order.paymentStatus === 'Verified') {
        categoryMap[cat].revenue += order.totalPrice;
      }
    });

    return Object.values(categoryMap).sort((a, b) => b.value - a.value);
  }, [filteredOrders]);

  // Transform 3: Order Status summary
  const statusData = useMemo(() => {
    const statuses: { [key: string]: number } = {
      Pending: 0,
      Confirmed: 0,
      Shipped: 0,
      Cancelled: 0,
    };

    filteredOrders.forEach((order) => {
      const state = order.orderStatus || 'Pending';
      if (state in statuses) {
        statuses[state]++;
      } else {
        statuses[state] = (statuses[state] || 0) + 1;
      }
    });

    return Object.keys(statuses).map((key) => ({
      name: key,
      value: statuses[key],
    }));
  }, [filteredOrders]);

  return (
    <div className="space-y-6" id="reports-main-layout">
      {/* Top Title Section */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 p-1">
        <div>
          <h3 className="text-xl font-black text-neutral-900 font-sans tracking-tight">Agricultural Sales & Analytics</h3>
          <p className="text-xs text-neutral-500 mt-1">Real-time charts visualising customer reservation volumes, revenues, and livestock patterns.</p>
        </div>

        {/* Filters Panel */}
        <div className="flex flex-wrap items-center gap-2 bg-neutral-100 border border-neutral-200 p-2 rounded-2xl">
          <div className="flex items-center gap-1 px-2 text-neutral-500">
            <Filter size={14} className="text-emerald-800" />
            <span className="text-[10px] font-black uppercase text-neutral-500">Filters:</span>
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="text-xs p-2.5 bg-white border border-neutral-300 text-black font-extrabold focus:ring-2 focus:ring-emerald-700 rounded-xl outline-none cursor-pointer"
          >
            <option value="all" className="text-black font-bold">All Transactions</option>
            <option value="verified" className="text-black font-bold">Verified Transfers Only</option>
            <option value="pending" className="text-black font-bold">Pending Admin Action</option>
          </select>

          <select
            value={timeFilter}
            onChange={(e) => setTimeFilter(e.target.value as any)}
            className="text-xs p-2.5 bg-white border border-neutral-300 text-black font-extrabold focus:ring-2 focus:ring-emerald-700 rounded-xl outline-none cursor-pointer"
          >
            <option value="all" className="text-black font-bold">All Time</option>
            <option value="year" className="text-black font-bold">Past 12 Months</option>
            <option value="month" className="text-black font-bold">Past 30 Days</option>
            <option value="custom" className="text-black font-bold">Custom Range</option>
          </select>

          {timeFilter === 'custom' && (
            <div className="flex items-center gap-1.5 animate-fade-in pl-2 border-l border-neutral-300">
              <span className="text-[10px] font-bold text-neutral-500 font-sans uppercase">From</span>
              <input
                type="date"
                id="reports-filter-start-date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="text-xs px-2.5 py-2 bg-white border border-neutral-300 rounded-xl text-black font-extrabold focus:ring-2 focus:ring-emerald-700 outline-none cursor-pointer"
              />
              <span className="text-[10px] font-bold text-neutral-500 font-sans uppercase">To</span>
              <input
                type="date"
                id="reports-filter-end-date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="text-xs px-2.5 py-2 bg-white border border-neutral-300 rounded-xl text-black font-extrabold focus:ring-2 focus:ring-emerald-700 outline-none cursor-pointer"
              />
            </div>
          )}
        </div>
      </div>

      {/* KPI Highlight Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Verified Cash Flow */}
        <div className="bg-white border border-neutral-200 hover:border-emerald-200 p-5 rounded-2xl shadow-xs transition-all hover:translate-y-[-2px] duration-200 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-50 rounded-full translate-x-10 translate-y-[-20px] group-hover:scale-110 transition-transform duration-300 -z-0 opacity-40" />
          <div className="flex items-center justify-between relative z-10">
            <div>
              <p className="text-[10px] font-black tracking-widest uppercase text-neutral-400">Verified Revenue</p>
              <h4 className="text-2xl font-black font-sans text-neutral-900 mt-1">₦{metrics.totalRevenue.toLocaleString()}</h4>
            </div>
            <div className="p-2.5 bg-emerald-50 text-emerald-800 rounded-xl">
              <Coins size={18} />
            </div>
          </div>
          <p className="text-[10px] text-neutral-500 mt-3 font-semibold flex items-center gap-1 relative z-10">
            <span className="text-emerald-700 font-extrabold font-mono">Verified Payment State</span>
            <span>orders successfully validated.</span>
          </p>
        </div>

        {/* KPI 2: Total Reservations Managed */}
        <div className="bg-white border border-neutral-200 hover:border-emerald-200 p-5 rounded-2xl shadow-xs transition-all hover:translate-y-[-2px] duration-200 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-amber-50 rounded-full translate-x-10 translate-y-[-20px] group-hover:scale-110 transition-transform duration-300 -z-0 opacity-40" />
          <div className="flex items-center justify-between relative z-10">
            <div>
              <p className="text-[10px] font-black tracking-widest uppercase text-neutral-400">Total Bookings</p>
              <h4 className="text-2xl font-black font-sans text-neutral-900 mt-1">{metrics.totalOrders}</h4>
            </div>
            <div className="p-2.5 bg-amber-50 text-amber-900 rounded-xl">
              <ShoppingBag size={18} />
            </div>
          </div>
          <p className="text-[10px] text-neutral-500 mt-3 font-semibold flex items-center gap-1.5 relative z-10">
            <span className="text-amber-700 font-black font-mono">{metrics.pendingCount} Pending</span>
            <span>require administrative audit.</span>
          </p>
        </div>

        {/* KPI 3: Units Livestock Sold */}
        <div className="bg-white border border-neutral-200 hover:border-emerald-200 p-5 rounded-2xl shadow-xs transition-all hover:translate-y-[-2px] duration-200 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-teal-50 rounded-full translate-x-10 translate-y-[-20px] group-hover:scale-110 transition-transform duration-300 -z-0 opacity-40" />
          <div className="flex items-center justify-between relative z-10">
            <div>
              <p className="text-[10px] font-black tracking-widest uppercase text-neutral-400">Total Stock Sold</p>
              <h4 className="text-2xl font-black font-sans text-neutral-900 mt-1">{metrics.totalItems.toLocaleString()} <span className="text-xs text-neutral-400 font-semibold font-sans">units</span></h4>
            </div>
            <div className="p-2.5 bg-teal-50 text-teal-800 rounded-xl">
              <Layers size={18} />
            </div>
          </div>
          <p className="text-[10px] text-neutral-500 mt-3 font-semibold flex items-center gap-1 relative z-10">
            <span className="text-teal-700 font-extrabold font-mono">Consolidated inventory</span>
            <span>across all animal modules.</span>
          </p>
        </div>

        {/* KPI 4: Average Verified Ticket */}
        <div className="bg-white border border-neutral-200 hover:border-emerald-200 p-5 rounded-2xl shadow-xs transition-all hover:translate-y-[-2px] duration-200 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-50 rounded-full translate-x-10 translate-y-[-20px] group-hover:scale-110 transition-transform duration-300 -z-0 opacity-40" />
          <div className="flex items-center justify-between relative z-10">
            <div>
              <p className="text-[10px] font-black tracking-widest uppercase text-neutral-400">Average Order Value</p>
              <h4 className="text-2xl font-black font-sans text-neutral-900 mt-1">₦{metrics.averageOrderValue.toLocaleString()}</h4>
            </div>
            <div className="p-2.5 bg-indigo-50 text-indigo-800 rounded-xl">
              <TrendingUp size={11} className="scale-150" />
            </div>
          </div>
          <p className="text-[10px] text-neutral-500 mt-3 font-semibold flex items-center gap-1 relative z-10">
            <span className="text-indigo-700 font-extrabold font-mono">Average customer spend</span>
            <span>per verified reservation.</span>
          </p>
        </div>
      </div>

      {/* Visual Analytics Sector */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Chart Card 1: Revenue Trends & Order Volume */}
        <div className="lg:col-span-8 bg-white border border-neutral-200/80 p-5 rounded-2xl shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h4 className="text-xs font-black uppercase text-neutral-800 tracking-wider">Revenue Stream & Order Volumes</h4>
              <p className="text-[10px] text-neutral-400 mt-0.5">Line chart showing verified cash-flow matching bar chart showing reservation quantities.</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5 text-[10px] font-bold text-emerald-800 font-mono">
                <span className="w-3 h-1.5 bg-emerald-700 rounded-full inline-block"></span>
                <span>Revenue (₦)</span>
              </div>
              <div className="flex items-center gap-1.5 text-[10px] font-bold text-amber-600 font-mono">
                <span className="w-3 h-1.5 bg-amber-500 rounded-full inline-block"></span>
                <span>Volume (qty)</span>
              </div>
            </div>
          </div>

          <div className="w-full h-80" id="monthly-trends-chart">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={monthlyData} margin={{ top: 10, right: 10, left: -10, bottom: 5 }}>
                <defs>
                  <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#198754" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#198754" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis 
                  dataKey="month" 
                  tick={{ fill: '#737373', fontSize: 9, fontWeight: 700 }} 
                  axisLine={{ stroke: '#e5e5e5' }}
                  tickLine={{ stroke: '#e5e5e5' }}
                />
                <YAxis 
                  yAxisId="left"
                  tickFormatter={(val) => `₦${val >= 1000000 ? (val/1000000).toFixed(1)+'M' : val >= 1000 ? (val/1000).toFixed(0)+'k' : val}`}
                  tick={{ fill: '#737373', fontSize: 9, fontWeight: 700 }}
                  axisLine={{ stroke: '#e5e5e5' }}
                  tickLine={{ stroke: '#e5e5e5' }}
                />
                <YAxis 
                  yAxisId="right"
                  orientation="right"
                  tick={{ fill: '#b45309', fontSize: 9, fontWeight: 700 }}
                  axisLine={{ stroke: '#e5e5e5' }}
                  tickLine={{ stroke: '#e5e5e5' }}
                />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#171717', border: 'none', borderRadius: '12px', color: '#fff', fontSize: '11px' }}
                  formatter={(value: any, name: any) => {
                    if (name === 'revenue') return [`₦${Number(value).toLocaleString()}`, 'Verified Revenue'];
                    if (name === 'volume') return [`${value} bookings`, 'Order Volume'];
                    return [value, name];
                  }}
                />
                <Bar 
                  yAxisId="right" 
                  dataKey="volume" 
                  fill="#dfa526" 
                  radius={[4, 4, 0, 0]} 
                  maxBarSize={30}
                  opacity={0.85}
                />
                <Line 
                  yAxisId="left" 
                  type="monotone" 
                  dataKey="revenue" 
                  stroke="#198754" 
                  strokeWidth={3} 
                  dot={{ r: 4, strokeWidth: 1 }} 
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart Card 2: Popular livestock Categories */}
        <div className="lg:col-span-4 bg-white border border-neutral-200/80 p-5 rounded-2xl shadow-xs space-y-4 flex flex-col justify-between">
          <div>
            <h4 className="text-xs font-black uppercase text-neutral-800 tracking-wider">Livestock Split (By Quantity Sold)</h4>
            <p className="text-[10px] text-neutral-400 mt-0.5">Quantity breakdown of various species selected for reservation.</p>
          </div>

          <div className="w-full h-56 flex items-center justify-center relative" id="category-pie-chart">
            {categoryData.length === 0 ? (
              <div className="text-center space-y-1">
                <p className="text-xs text-neutral-400 font-medium">No category sales recorded yet.</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={75}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {categoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#171717', border: 'none', borderRadius: '12px', color: '#fff', fontSize: '11px' }}
                    formatter={(val) => [`${Number(val).toLocaleString()} units`, 'Quantity Sold']}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
            {categoryData.length > 0 && (
              <div className="absolute flex flex-col items-center justify-center pointer-events-none">
                <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">Total units</span>
                <span className="text-base font-black text-neutral-800">{metrics.totalItems}</span>
              </div>
            )}
          </div>

          {/* Pie Chart Legend List */}
          <div className="space-y-2 max-h-36 overflow-y-auto pr-1">
            {categoryData.map((item, index) => (
              <div key={item.name} className="flex items-center justify-between text-xs font-medium">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                  <span className="text-neutral-700 font-bold">{item.name}</span>
                </div>
                <div className="text-right">
                  <div className="font-mono text-[10px] font-black text-neutral-800">{item.value.toLocaleString()} units</div>
                  <div className="text-[8px] font-semibold text-neutral-400">₦{item.revenue.toLocaleString()}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Status Distribution Breakdown */}
        <div className="lg:col-span-4 bg-white border border-neutral-200 p-5 rounded-2xl shadow-xs space-y-4">
          <div>
            <h4 className="text-xs font-black uppercase text-neutral-800 tracking-wider">Reservation Status Split</h4>
            <p className="text-[10px] text-neutral-400 mt-0.5">Analysis of processed, shipped, or pending customer bookings.</p>
          </div>

          <div className="w-full h-48 py-1 flex items-center justify-center relative">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={statusData} layout="vertical" margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f6f6f6" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 9, fontWeight: 700 }} axisLine={false} tickLine={false} />
                <YAxis dataKey="name" type="category" tick={{ fill: '#374151', fontSize: 9, fontWeight: 800 }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ backgroundColor: '#171717', border: 'none', borderRadius: '12px', color: '#fff', fontSize: '11.5px' }} />
                <Bar dataKey="value" radius={[0, 4, 4, 0]} maxBarSize={18}>
                  {statusData.map((entry, index) => {
                    let color = '#737373';
                    if (entry.name === 'Pending') color = '#dfa526';
                    if (entry.name === 'Confirmed') color = '#20c997';
                    if (entry.name === 'Shipped') color = '#198754';
                    if (entry.name === 'Cancelled') color = '#dc3545';
                    return <Cell key={`cell-${index}`} fill={color} />;
                  })}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-2 gap-2 text-center bg-neutral-50 p-2.5 rounded-xl border border-neutral-100">
            <div>
              <span className="text-[8px] font-black uppercase tracking-wider text-neutral-400">Completion Rate</span>
              <p className="text-sm font-black text-emerald-800 font-mono">
                {metrics.totalOrders > 0 
                  ? `${Math.round(((metrics.totalOrders - metrics.pendingCount) / metrics.totalOrders) * 100)}%` 
                  : '100%'}
              </p>
            </div>
            <div>
              <span className="text-[8px] font-black uppercase tracking-wider text-neutral-400">Receipt Rate</span>
              <p className="text-sm font-black text-indigo-800 font-mono">
                {metrics.totalOrders > 0 
                  ? `${Math.round((metrics.verifiedCount / metrics.totalOrders) * 100)}%` 
                  : '0%'}
              </p>
            </div>
          </div>
        </div>

        {/* Detailed Sales Ledger Table */}
        <div className="lg:col-span-8 bg-white border border-neutral-200 p-5 rounded-2xl shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div>
              <h4 className="text-xs font-black uppercase text-neutral-800 tracking-wider">Product Catalog Contribution</h4>
              <p className="text-[10px] text-neutral-400 mt-0.5">Inventory species cross-compared to actual units sold and total verified turnover.</p>
            </div>
            <span className="bg-emerald-50 text-emerald-800 text-[9px] font-extrabold px-2.5 py-1 rounded-full uppercase tracking-wide border border-emerald-100">
              {categoryData.length} active classes
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-neutral-100 text-[10px] font-black text-neutral-400 uppercase tracking-widest bg-neutral-50/50">
                  <th className="py-2.5 px-3">Species Category</th>
                  <th className="py-2.5 px-3 text-right">Units Reserved</th>
                  <th className="py-2.5 px-3 text-right">Verified Revenue</th>
                  <th className="py-2.5 px-3 text-right">Revenue Contribution</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100 text-xs">
                {categoryData.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-neutral-400 font-semibold italic">
                      No order ledger data available under current filters.
                    </td>
                  </tr>
                ) : (
                  categoryData.map((cat, idx) => {
                    const pct = metrics.totalRevenue > 0 
                      ? Math.round((cat.revenue / metrics.totalRevenue) * 100) 
                      : 0;

                    return (
                      <tr key={cat.name} className="hover:bg-neutral-50/60 transition-colors">
                        <td className="py-3 px-3 font-semibold text-neutral-800 flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[idx % COLORS.length] }} />
                          <span>{cat.name}</span>
                        </td>
                        <td className="py-3 px-3 text-right font-mono font-bold text-neutral-700">
                          {cat.value.toLocaleString()}
                        </td>
                        <td className="py-3 px-3 text-right font-mono font-black text-emerald-800">
                          ₦{cat.revenue.toLocaleString()}
                        </td>
                        <td className="py-3 px-3 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <span className="font-mono font-black text-neutral-500 text-[11px]">{pct}%</span>
                            <div className="w-12 bg-neutral-100 h-1.5 rounded-full overflow-hidden">
                              <div 
                                className="h-full rounded-full" 
                                style={{ 
                                  backgroundColor: COLORS[idx % COLORS.length], 
                                  width: `${pct}%` 
                                }} 
                              />
                            </div>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
