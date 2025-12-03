"use client"

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts"

interface WealthChartProps {
  data: Array<{
    date: Date | string
    month: number
    year: number
    totalNetWorth: number
    liquidAssets: number
    investments: number
    reserves: number
    isSnapshot: boolean
  }>
}

export function WealthChart({ data }: WealthChartProps) {
  const chartData = data.map((item) => {
    const date = item.date instanceof Date ? item.date : new Date(item.date)
    return {
      name: `${item.month}/${item.year}`,
      "Gesamtvermögen": item.totalNetWorth,
      "Liquide Mittel": item.liquidAssets,
      "Kapitalanlagen": item.investments,
      "Rückstellungen": item.reserves,
    }
  })

  return (
    <ResponsiveContainer width="100%" height={400}>
      <LineChart data={chartData}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="name" />
        <YAxis
          tickFormatter={(value) =>
            new Intl.NumberFormat("de-DE", {
              style: "currency",
              currency: "EUR",
              notation: "compact",
            }).format(value)
          }
        />
        <Tooltip
          formatter={(value: number) =>
            new Intl.NumberFormat("de-DE", {
              style: "currency",
              currency: "EUR",
            }).format(value)
          }
        />
        <Legend />
        <Line
          type="monotone"
          dataKey="Gesamtvermögen"
          stroke="#2563eb"
          strokeWidth={2}
        />
        <Line
          type="monotone"
          dataKey="Liquide Mittel"
          stroke="#10b981"
          strokeWidth={2}
        />
        <Line
          type="monotone"
          dataKey="Kapitalanlagen"
          stroke="#f59e0b"
          strokeWidth={2}
        />
        <Line
          type="monotone"
          dataKey="Rückstellungen"
          stroke="#8b5cf6"
          strokeWidth={2}
        />
      </LineChart>
    </ResponsiveContainer>
  )
}





