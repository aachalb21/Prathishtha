import { useState, useEffect } from 'react'
import { paymentAPI } from '../services/api'
import useAuthStore from '../store/authStore'
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  MagnifyingGlassIcon,
  CalendarIcon,
  CurrencyRupeeIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
} from '@heroicons/react/24/outline'
import logger from '../utils/logger'

// Utility function to export transactions to CSV
const exportTransactionsToCSV = (transactions) => {
  if (!transactions || transactions.length === 0) {
    alert('No transactions to export')
    return
  }

  const headers = ['Transaction ID', 'Order ID', 'User Name', 'User Email', 'Event', 'Amount', 'Currency', 'Status', 'Payment Method', 'Date', 'Time']
  const rows = transactions.map(txn => [
    txn.transactionId || '',
    txn.orderId || '',
    txn.user?.name || '',
    txn.user?.email || '',
    txn.event?.name || '',
    txn.amount || '',
    txn.currency || '',
    txn.status || '',
    txn.paymentMethod || '',
    new Date(txn.createdAt).toLocaleDateString('en-IN'),
    new Date(txn.createdAt).toLocaleTimeString('en-IN')
  ])

  // Create CSV content
  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
  ].join('\n')

  // Create blob and download
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  const url = URL.createObjectURL(blob)
  link.setAttribute('href', url)
  link.setAttribute('download', `transactions_${new Date().toISOString().split('T')[0]}.csv`)
  link.style.visibility = 'hidden'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

const STATUS_CONFIG = {
  SUCCESS: { color: 'bg-green-100', textColor: 'text-green-800', icon: CheckCircleIcon },
  FAILED: { color: 'bg-red-100', textColor: 'text-red-800', icon: XCircleIcon },
  INITIATED: { color: 'bg-blue-100', textColor: 'text-blue-800', icon: ClockIcon },
  PENDING: { color: 'bg-yellow-100', textColor: 'text-yellow-800', icon: ClockIcon },
}

export default function TransactionsPage() {
  const { admin } = useAuthStore()
  const [transactions, setTransactions] = useState([])
  const [summary, setSummary] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Filter states
  const [filters, setFilters] = useState({
    status: '',
    startDate: '',
    endDate: '',
    searchQuery: '',
  })

  // Pagination states
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 25,
    total: 0,
    totalPages: 1,
  })

  // Fetch transactions
  const fetchTransactions = async () => {
    try {
      setLoading(true)
      setError(null)

      const params = {
        page: pagination.page,
        limit: pagination.limit,
      }

      if (filters.status) params.status = filters.status
      if (filters.startDate) params.startDate = filters.startDate
      if (filters.endDate) params.endDate = filters.endDate

      const response = await paymentAPI.getAllTransactions(params)
      
      if (response.success) {
        let data = response.transactions || []
        
        // Client-side search filtering
        if (filters.searchQuery) {
          const query = filters.searchQuery.toLowerCase()
          data = data.filter(txn => 
            txn.transactionId?.toLowerCase().includes(query) ||
            txn.orderId?.toLowerCase().includes(query) ||
            txn.user?.name?.toLowerCase().includes(query) ||
            txn.user?.email?.toLowerCase().includes(query) ||
            txn.event?.name?.toLowerCase().includes(query)
          )
        }

        setTransactions(data)
        setPagination(prev => ({
          ...prev,
          ...response.pagination,
        }))
      } else {
        setError(response.message || 'Failed to fetch transactions')
      }
    } catch (err) {
      logger.error('Error fetching transactions:', err)
      setError(err.message || 'Failed to fetch transactions')
    } finally {
      setLoading(false)
    }
  }

  // Fetch summary
  const fetchSummary = async () => {
    try {
      const params = {}
      if (filters.startDate) params.startDate = filters.startDate
      if (filters.endDate) params.endDate = filters.endDate

      const response = await paymentAPI.getTransactionSummary(params)
      if (response.success) {
        setSummary(response.summary)
      }
    } catch (err) {
      logger.error('Error fetching summary:', err)
    }
  }

  // Initial load and filter changes
  useEffect(() => {
    setPagination(prev => ({ ...prev, page: 1 }))
  }, [filters.status, filters.startDate, filters.endDate, filters.searchQuery])

  useEffect(() => {
    fetchTransactions()
    fetchSummary()
  }, [filters, pagination.page, pagination.limit])

  // Check admin access
  if (!admin || !['SuperAdmin', 'Admin'].includes(admin.role)) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-md mx-auto bg-white rounded-lg shadow p-6 text-center">
          <p className="text-red-600 font-medium">Access Denied</p>
          <p className="text-gray-600 mt-2">You don't have permission to view transactions</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900">Transactions & Orders</h1>
          <p className="text-gray-600 mt-2">View and manage all payment transactions</p>
        </div>

        {/* Summary Cards */}
        {summary && (
          <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
            <SummaryCard
              title="Total"
              count={summary.total?.count || 0}
              amount={summary.total?.amount || 0}
              color="bg-blue"
            />
            <SummaryCard
              title="Successful"
              count={summary.success?.count || 0}
              amount={summary.success?.amount || 0}
              color="bg-green"
            />
            <SummaryCard
              title="Failed"
              count={summary.failed?.count || 0}
              amount={summary.failed?.amount || 0}
              color="bg-red"
            />
            <SummaryCard
              title="Pending"
              count={summary.pending?.count || 0}
              amount={summary.pending?.amount || 0}
              color="bg-yellow"
            />
            <SummaryCard
              title="Initiated"
              count={summary.initiated?.count || 0}
              amount={summary.initiated?.amount || 0}
              color="bg-purple"
            />
          </div>
        )}

        {/* Filters Section */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Search */}
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search by ID, email, name..."
                value={filters.searchQuery}
                onChange={(e) => setFilters(prev => ({ ...prev, searchQuery: e.target.value }))}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              />
            </div>

            {/* Status Filter */}
            <select
              value={filters.status}
              onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            >
              <option value="">All Statuses</option>
              <option value="SUCCESS">Successful</option>
              <option value="FAILED">Failed</option>
              <option value="PENDING">Pending</option>
              <option value="INITIATED">Initiated</option>
            </select>

            {/* Start Date */}
            <div className="relative">
              <CalendarIcon className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
              <input
                type="date"
                value={filters.startDate}
                onChange={(e) => setFilters(prev => ({ ...prev, startDate: e.target.value }))}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              />
            </div>

            {/* End Date */}
            <div className="relative">
              <CalendarIcon className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
              <input
                type="date"
                value={filters.endDate}
                onChange={(e) => setFilters(prev => ({ ...prev, endDate: e.target.value }))}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              />
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 text-red-700">
            {error}
          </div>
        )}

        {/* Transactions Table */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          ) : transactions.length === 0 ? (
            <div className="flex items-center justify-center h-64 text-gray-500">
              <div className="text-center">
                <p className="text-lg font-medium">No transactions found</p>
                <p className="text-sm">Try adjusting your filters</p>
              </div>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200">
                      <th className="px-6 py-3 text-left font-medium text-gray-900">Transaction ID</th>
                      <th className="px-6 py-3 text-left font-medium text-gray-900">Trace ID</th>
                      <th className="px-6 py-3 text-left font-medium text-gray-900">Order ID</th>
                      <th className="px-6 py-3 text-left font-medium text-gray-900">User</th>
                      <th className="px-6 py-3 text-left font-medium text-gray-900">Event</th>
                      <th className="px-6 py-3 text-left font-medium text-gray-900">Amount</th>
                      <th className="px-6 py-3 text-left font-medium text-gray-900">Status</th>
                      <th className="px-6 py-3 text-left font-medium text-gray-900">Payment Method</th>
                      <th className="px-6 py-3 text-left font-medium text-gray-900">Date</th>
                      <th className="px-6 py-3 text-left font-medium text-gray-900">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {transactions.map((txn) => (
                      <TransactionRow key={txn.transactionId} transaction={txn} />
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
                <div className="text-sm text-gray-600">
                  Showing {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} transactions
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setPagination(prev => ({ ...prev, page: Math.max(1, prev.page - 1) }))}
                    disabled={pagination.page === 1}
                    className="p-2 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed rounded"
                  >
                    <ChevronLeftIcon className="h-5 w-5" />
                  </button>
                  <span className="text-sm text-gray-600">
                    Page {pagination.page} of {pagination.totalPages}
                  </span>
                  <button
                    onClick={() => setPagination(prev => ({ ...prev, page: Math.min(prev.totalPages, prev.page + 1) }))}
                    disabled={pagination.page === pagination.totalPages}
                    className="p-2 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed rounded"
                  >
                    <ChevronRightIcon className="h-5 w-5" />
                  </button>
                </div>
              </div>

              {/* Export/Download Button */}
              <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
                <button
                  onClick={() => exportTransactionsToCSV(transactions)}
                  className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium"
                >
                  📥 Export to CSV
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

function SummaryCard({ title, count, amount, color }) {
  const colorClasses = {
    'bg-blue': { card: 'bg-blue-50 border-blue-200', text: 'text-blue-900', subtext: 'text-blue-700' },
    'bg-green': { card: 'bg-green-50 border-green-200', text: 'text-green-900', subtext: 'text-green-700' },
    'bg-red': { card: 'bg-red-50 border-red-200', text: 'text-red-900', subtext: 'text-red-700' },
    'bg-yellow': { card: 'bg-yellow-50 border-yellow-200', text: 'text-yellow-900', subtext: 'text-yellow-700' },
    'bg-purple': { card: 'bg-purple-50 border-purple-200', text: 'text-purple-900', subtext: 'text-purple-700' },
  }

  const classes = colorClasses[color] || colorClasses['bg-blue']

  return (
    <div className={`${classes.card} border rounded-lg p-4`}>
      <p className={`text-sm font-medium ${classes.text} mb-1`}>{title}</p>
      <p className={`text-2xl font-bold ${classes.text}`}>{count}</p>
      <p className={`text-xs ${classes.subtext} mt-2`}>₹{amount.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</p>
    </div>
  )
}

function TransactionRow({ transaction }) {
  const [expanded, setExpanded] = useState(false)

  const statusConfig = STATUS_CONFIG[transaction.status] || STATUS_CONFIG.PENDING
  const StatusIcon = statusConfig.icon

  return (
    <>
      <tr className="hover:bg-gray-50 cursor-pointer" onClick={() => setExpanded(!expanded)}>
        <td className="px-6 py-4 font-medium text-blue-600 hover:text-blue-800">
          <div className="font-mono text-xs">{transaction.transactionId}</div>
        </td>
        <td className="px-6 py-4">
          <div className="font-mono text-xs text-gray-600">
            {transaction.bdTraceId ? (
              <span className="break-all">{transaction.bdTraceId}</span>
            ) : (
              <span className="text-gray-400">N/A</span>
            )}
          </div>
        </td>
        <td className="px-6 py-4">
          <div className="font-mono text-xs text-gray-600">{transaction.orderId}</div>
        </td>
        <td className="px-6 py-4">
          {transaction.user ? (
            <div>
              <p className="font-medium text-gray-900">{transaction.user.name}</p>
              <p className="text-xs text-gray-500">{transaction.user.email}</p>
            </div>
          ) : (
            <p className="text-gray-500 text-sm">N/A</p>
          )}
        </td>
        <td className="px-6 py-4">
          {transaction.event ? (
            <p className="font-medium text-gray-900">{transaction.event.name}</p>
          ) : (
            <p className="text-gray-500 text-sm">N/A</p>
          )}
        </td>
        <td className="px-6 py-4">
          <div className="flex items-center">
            <CurrencyRupeeIcon className="h-4 w-4 text-gray-400" />
            <span className="font-medium text-gray-900">{transaction.amount.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</span>
          </div>
        </td>
        <td className="px-6 py-4">
          <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full ${statusConfig.color}`}>
            <StatusIcon className="h-4 w-4" />
            <span className={`text-xs font-medium ${statusConfig.textColor}`}>{transaction.status}</span>
          </div>
        </td>
        <td className="px-6 py-4">
          <p className="text-gray-600 text-sm">{transaction.paymentMethod || 'N/A'}</p>
        </td>
        <td className="px-6 py-4 text-gray-600 text-sm">
          {new Date(transaction.createdAt).toLocaleDateString('en-IN')}
        </td>
        <td className="px-6 py-4 text-center">
          <button
            onClick={(e) => {
              e.stopPropagation()
              setExpanded(!expanded)
            }}
            className="text-blue-600 hover:text-blue-800 font-medium text-sm"
          >
            {expanded ? 'Hide' : 'View'}
          </button>
        </td>
      </tr>
      
      {/* Expanded Details Row */}
      {expanded && (
        <tr className="bg-gray-50">
          <td colSpan="10" className="px-6 py-4">
            <TransactionDetails transaction={transaction} />
          </td>
        </tr>
      )}
    </>
  )
}

function TransactionDetails({ transaction }) {
  return (
    <div className="space-y-6">
      {/* Transaction IDs Section */}
      <div>
        <h4 className="font-semibold text-gray-900 mb-3">Transaction IDs</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <DetailItem label="Transaction ID" value={transaction.transactionId} copyable />
          <DetailItem label="Order ID" value={transaction.orderId} copyable />
          <DetailItem label="BD Order ID" value={transaction.bdOrderId || 'N/A'} copyable />
          <DetailItem label="BD Transaction ID" value={transaction.bdTransactionId || 'N/A'} copyable />
          <DetailItem label="BD Trace ID" value={transaction.bdTraceId || 'N/A'} copyable />
        </div>
      </div>

      {/* Amount & Status Section */}
      <div>
        <h4 className="font-semibold text-gray-900 mb-3">Transaction Status</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <DetailItem label="Status" value={transaction.status} />
          <DetailItem label="Amount" value={`₹${transaction.amount.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`} />
          <DetailItem label="Currency" value={transaction.currency} />
        </div>
      </div>

      {/* User Information Section */}
      {transaction.user && (
        <div>
          <h4 className="font-semibold text-gray-900 mb-3">User Information</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <DetailItem label="User Name" value={transaction.user.name} />
            <DetailItem label="User Email" value={transaction.user.email} copyable />
            <DetailItem label="User Phone" value={transaction.user.phone || 'N/A'} />
          </div>
        </div>
      )}

      {/* Event Information Section */}
      {transaction.event && (
        <div>
          <h4 className="font-semibold text-gray-900 mb-3">Event Information</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <DetailItem label="Event Name" value={transaction.event.name} />
            <DetailItem label="Event Slug" value={transaction.event.slug || 'N/A'} />
          </div>
        </div>
      )}

      {/* Payment Method Details Section */}
      <div>
        <h4 className="font-semibold text-gray-900 mb-3">Payment Method</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <DetailItem label="Payment Method" value={transaction.paymentMethod || 'N/A'} />
          <DetailItem label="Auth Status" value={transaction.authStatus || 'N/A'} />
          {transaction.paymentMethodDetails?.cardType && (
            <>
              <DetailItem label="Card Type" value={transaction.paymentMethodDetails.cardType} />
              <DetailItem label="Card Network" value={transaction.paymentMethodDetails.cardNetwork || 'N/A'} />
            </>
          )}
          {transaction.paymentMethodDetails?.bankName && (
            <DetailItem label="Bank Name" value={transaction.paymentMethodDetails.bankName} />
          )}
          {transaction.paymentMethodDetails?.upiId && (
            <DetailItem label="UPI ID" value={transaction.paymentMethodDetails.upiId} copyable />
          )}
          {transaction.paymentMethodDetails?.walletName && (
            <DetailItem label="Wallet" value={transaction.paymentMethodDetails.walletName} />
          )}
        </div>
      </div>

      {/* Error Details Section (if applicable) */}
      {(transaction.errorCode || transaction.errorDescription) && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <h4 className="font-semibold text-red-900 mb-3">Error Details</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <DetailItem label="Error Code" value={transaction.errorCode || 'N/A'} />
            <DetailItem label="Error Description" value={transaction.errorDescription || 'N/A'} />
          </div>
        </div>
      )}

      {/* Timestamps Section */}
      <div>
        <h4 className="font-semibold text-gray-900 mb-3">Timeline</h4>
        <div className="space-y-3">
          <DetailItem
            label="Initiated At"
            value={new Date(transaction.initiatedAt).toLocaleString('en-IN')}
          />
          {transaction.completedAt && (
            <DetailItem
              label="Completed At"
              value={new Date(transaction.completedAt).toLocaleString('en-IN')}
            />
          )}
          {transaction.failedAt && (
            <DetailItem
              label="Failed At"
              value={new Date(transaction.failedAt).toLocaleString('en-IN')}
            />
          )}
          {transaction.createdAt && (
            <DetailItem
              label="Created At"
              value={new Date(transaction.createdAt).toLocaleString('en-IN')}
            />
          )}
          {transaction.updatedAt && (
            <DetailItem
              label="Updated At"
              value={new Date(transaction.updatedAt).toLocaleString('en-IN')}
            />
          )}
        </div>
      </div>

      {/* Request/Response Payloads (collapsed by default) */}
      <PayloadSection title="Request Payload" data={transaction.requestPayload} />
      <PayloadSection title="Response Payload" data={transaction.responsePayload} />

      {/* Additional Info Section */}
      <div>
        <h4 className="font-semibold text-gray-900 mb-3">Additional Information</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <DetailItem label="IP Address" value={transaction.ipAddress || 'N/A'} copyable />
          <DetailItem label="Remarks" value={transaction.remarks || 'N/A'} />
        </div>
      </div>
    </div>
  )
}

function PayloadSection({ title, data }) {
  const [expanded, setExpanded] = useState(false)

  if (!data) return null

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full px-4 py-3 bg-gray-50 hover:bg-gray-100 flex items-center justify-between font-semibold text-gray-900"
      >
        <span>{title}</span>
        <span className={`transform transition-transform ${expanded ? 'rotate-180' : ''}`}>
          ▼
        </span>
      </button>
      {expanded && (
        <div className="p-4 bg-gray-50 border-t border-gray-200">
          <pre className="bg-white p-3 rounded border border-gray-200 text-xs overflow-auto max-h-64 text-gray-700">
            {JSON.stringify(data, null, 2)}
          </pre>
        </div>
      )}
    </div>
  )
}

function DetailItem({ label, value, copyable }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = () => {
    navigator.clipboard.writeText(value)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="flex flex-col py-2 border-b border-gray-200 last:border-b-0">
      <span className="text-gray-600 font-medium text-sm">{label}</span>
      <div className="flex items-center justify-between mt-1">
        <span className="text-gray-900 text-sm font-mono break-all">{value}</span>
        {copyable && (
          <button
            onClick={handleCopy}
            className="ml-2 px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded text-gray-700 whitespace-nowrap"
            title="Copy to clipboard"
          >
            {copied ? '✓ Copied' : 'Copy'}
          </button>
        )}
      </div>
    </div>
  )
}
