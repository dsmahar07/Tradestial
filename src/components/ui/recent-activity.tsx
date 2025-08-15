'use client'

import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader } from './card'
import { Button } from './button'
import { MoreHorizontal } from 'lucide-react'

const activities = [
  {
    id: 1,
    customer: 'Ronald Richards',
    email: 'ronald.richards@example.com',
    status: 'Member',
    customerId: '#74568200',
    time: '5 min ago',
    amount: '$12,568.20',
    avatar: 'RR'
  },
  {
    id: 2,
    customer: 'Daniel Samuelsom',
    email: 'daniel.samuelsom@example.com',
    status: 'Signed Up',
    customerId: '#25746935',
    time: '12 min ago',
    amount: '$200.50',
    avatar: 'DS'
  },
  {
    id: 3,
    customer: 'Warren McCormick',
    email: 'warren.mccormick@example.com',
    status: 'New Customer',
    customerId: '#45742837',
    time: '15 min ago',
    amount: '$2,865.00',
    avatar: 'WM'
  }
]

const statusColors = {
  'Member': 'bg-blue-500/20 text-blue-400',
  'Signed Up': 'bg-yellow-500/20 text-yellow-400',
  'New Customer': 'bg-green-500/20 text-green-400'
}

export function RecentActivity() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.8 }}
    >
      <Card className="bg-gray-800 border-gray-700 text-white col-span-2">
        <CardHeader className="flex flex-row items-center justify-between pb-4">
          <div>
            <h3 className="text-sm font-medium text-gray-400">Recent Activity</h3>
          </div>
          
          <div className="flex items-center space-x-2">
            <select className="bg-gray-700 text-white text-xs px-2 py-1 rounded border border-gray-600">
              <option>Last 24h</option>
              <option>Last 7 days</option>
              <option>Last 30 days</option>
            </select>
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-6 w-6 text-gray-400 hover:text-gray-200 hover:bg-gray-700/50"
            >
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Table Header */}
            <div className="grid grid-cols-5 gap-4 text-xs text-gray-400 font-medium pb-2 border-b border-gray-700">
              <div>Customer</div>
              <div>Status</div>
              <div>Customer ID</div>
              <div>Refund</div>
              <div>Amount</div>
            </div>
            
            {/* Table Rows */}
            {activities.map((activity, index) => (
              <motion.div
                key={activity.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: 0.1 * index }}
                className="grid grid-cols-5 gap-4 items-center py-3 hover:bg-gray-700/50 rounded-lg px-2 transition-colors"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                    <span className="text-xs font-semibold">{activity.avatar}</span>
                  </div>
                  <div>
                    <div className="text-sm font-medium">{activity.customer}</div>
                    <div className="text-xs text-gray-400">{activity.email}</div>
                  </div>
                </div>
                
                <div>
                  <span className={`text-xs px-2 py-1 rounded-full ${statusColors[activity.status as keyof typeof statusColors]}`}>
                    {activity.status}
                  </span>
                </div>
                
                <div className="text-sm text-gray-300">{activity.customerId}</div>
                
                <div className="text-sm text-gray-400">{activity.time}</div>
                
                <div className="text-sm font-medium">{activity.amount}</div>
              </motion.div>
            ))}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}