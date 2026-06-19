import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { adminApi } from '../api'
import AdminLayout from '../components/AdminLayout'
import { TrendingUp, ShoppingBag, DollarSign, Award } from 'lucide-react'

export default function AdminStatsPage() {
  const today = new Date().toISOString().slice(0, 10)
  const thirtyDaysAgo = new Date(Date.now() - 30 * 86400_000).toISOString().slice(0, 10)
  const [startDate, setStartDate] = useState(thirtyDaysAgo)
  const [endDate, setEndDate] = useState(today)

  const { data: stats, isLoading } = useQuery({
    queryKey: ['adminStats', startDate, endDate],
    queryFn: () => adminApi.stats({ startDate, endDate }),
  })

  return (
    <AdminLayout>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-display font-bold text-charcoal-900">統計報表</h1>
        <div className="flex items-center gap-2">
          <input type="date" className="input w-36 text-sm" value={startDate} onChange={e => setStartDate(e.target.value)} />
          <span className="text-charcoal-400">至</span>
          <input type="date" className="input w-36 text-sm" value={endDate} onChange={e => setEndDate(e.target.value)} />
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-3 gap-4">
          {[1, 2, 3].map(i => <div key={i} className="card h-28 animate-pulse" />)}
        </div>
      ) : stats ? (
        <>
          {/* KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
            {[
              { icon: DollarSign, label: '總營收', value: `NT$ ${stats.totalRevenue.toFixed(0)}`, color: 'text-dawn-600 bg-dawn-50' },
              { icon: ShoppingBag, label: '總訂單數', value: stats.totalOrders, color: 'text-blue-600 bg-blue-50' },
              { icon: TrendingUp, label: '平均客單價', value: `NT$ ${stats.averageOrderValue.toFixed(0)}`, color: 'text-green-600 bg-green-50' },
            ].map(({ icon: Icon, label, value, color }) => (
              <div key={label} className="card p-6 flex items-center gap-4">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${color}`}>
                  <Icon size={24} />
                </div>
                <div>
                  <p className="text-sm text-charcoal-500">{label}</p>
                  <p className="text-2xl font-bold text-charcoal-900">{value}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Top items */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="card p-6">
              <h2 className="font-display font-semibold text-charcoal-900 mb-4 flex items-center gap-2">
                <Award size={20} className="text-dawn-500" /> 熱銷餐點排行
              </h2>
              {stats.topMenuItems.length === 0 ? (
                <p className="text-charcoal-400 text-sm text-center py-8">暫無數據</p>
              ) : (
                <div className="space-y-3">
                  {stats.topMenuItems.map((item: any, i: number) => (
                    <div key={item.id} className="flex items-center gap-3">
                      <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                        i === 0 ? 'bg-yellow-100 text-yellow-700' :
                        i === 1 ? 'bg-charcoal-100 text-charcoal-600' :
                        i === 2 ? 'bg-orange-100 text-orange-600' : 'bg-charcoal-50 text-charcoal-500'
                      }`}>{i + 1}</span>
                      <div className="flex-1">
                        <div className="flex justify-between mb-1">
                          <span className="text-sm font-medium text-charcoal-900">{item.name}</span>
                          <span className="text-sm text-charcoal-600">{item.quantity} 份</span>
                        </div>
                        <div className="h-1.5 bg-charcoal-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-dawn-400 rounded-full"
                            style={{ width: `${(item.quantity / stats.topMenuItems[0].quantity) * 100}%` }}
                          />
                        </div>
                      </div>
                      <span className="text-xs text-dawn-600 font-medium w-20 text-right">NT$ {item.revenue.toFixed(0)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="card p-6">
              <h2 className="font-display font-semibold text-charcoal-900 mb-4">訂單狀態分佈</h2>
              {Object.keys(stats.ordersByStatus).length === 0 ? (
                <p className="text-charcoal-400 text-sm text-center py-8">暫無數據</p>
              ) : (
                <div className="space-y-3">
                  {Object.entries(stats.ordersByStatus).map(([s, count]) => {
                    const labels: Record<string, string> = { completed: '已完成', cancelled: '已取消', pending: '待確認', preparing: '準備中', ready: '可取餐' }
                    const colors: Record<string, string> = { completed: 'bg-green-400', cancelled: 'bg-red-400', pending: 'bg-yellow-400', preparing: 'bg-blue-400', ready: 'bg-teal-400' }
                    const total = Object.values(stats.ordersByStatus).reduce((a: any, b: any) => a + b, 0) as number
                    return (
                      <div key={s} className="flex items-center gap-3">
                        <span className={`w-3 h-3 rounded-full ${colors[s] || 'bg-charcoal-400'}`} />
                        <span className="text-sm text-charcoal-700 flex-1">{labels[s] || s}</span>
                        <span className="text-sm font-medium text-charcoal-900">{count as number}</span>
                        <span className="text-xs text-charcoal-400">{total > 0 ? ((count as number / total) * 100).toFixed(1) : 0}%</span>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Daily revenue table */}
          {stats.dailyRevenue.length > 0 && (
            <div className="card p-6 mt-6">
              <h2 className="font-display font-semibold text-charcoal-900 mb-4">每日營收</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-charcoal-100">
                      <th className="text-left py-2 text-charcoal-500 font-medium">日期</th>
                      <th className="text-right py-2 text-charcoal-500 font-medium">訂單數</th>
                      <th className="text-right py-2 text-charcoal-500 font-medium">營收</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-charcoal-100">
                    {stats.dailyRevenue.slice(-14).reverse().map((day: any) => (
                      <tr key={day.date}>
                        <td className="py-2 text-charcoal-700">{day.date}</td>
                        <td className="py-2 text-right text-charcoal-700">{day.orders}</td>
                        <td className="py-2 text-right font-semibold text-dawn-600">NT$ {day.revenue.toFixed(0)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      ) : null}
    </AdminLayout>
  )
}
