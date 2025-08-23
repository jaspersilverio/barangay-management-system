import React from 'react'

export type SummaryCardProps = {
  title: string
  value: string | number
  subtext?: string
  icon: React.ReactNode
}

export default function SummaryCard({ title, value, subtext, icon }: SummaryCardProps) {
  return (
    <div className="bg-white shadow rounded-lg p-4 flex flex-col">
      <div className="flex items-center gap-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gray-100 text-gray-700">
          {icon}
        </div>
        <div className="flex-1">
          <div className="text-sm font-medium uppercase tracking-wide text-gray-500">
            {title}
          </div>
          <div className="mt-1 text-2xl font-bold text-gray-900">
            {value}
          </div>
          {subtext ? (
            <div className="mt-1 text-xs text-gray-400">
              {subtext}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  )
}


