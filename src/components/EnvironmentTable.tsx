'use client'

import { Eye, EyeOff } from 'lucide-react'
import { useState } from 'react'

interface EnvironmentTableProps {
  variables: Record<string, string>
}

export default function EnvironmentTable({ variables }: EnvironmentTableProps) {
  const [visibleKeys, setVisibleKeys] = useState<Set<string>>(new Set())

  const toggleVisibility = (key: string) => {
    const newVisible = new Set(visibleKeys)
    if (newVisible.has(key)) {
      newVisible.delete(key)
    } else {
      newVisible.add(key)
    }
    setVisibleKeys(newVisible)
  }

  const variableEntries = Object.entries(variables)

  if (variableEntries.length === 0) {
    return (
      <div className="text-center py-8 text-gray-600 dark:text-gray-400 transition-colors">
        <p>No variables defined</p>
        <p className="text-sm mt-1">Add variables to use in your requests</p>
      </div>
    )
  }

  return (
    <div className="border border-gray-200 dark:border-[#3c3c3c] rounded overflow-hidden transition-colors">
      <table className="w-full">
        <thead className="bg-gray-100 dark:bg-[#2a2a2a] transition-colors">
          <tr>
            <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 dark:text-gray-300 transition-colors">
              Name
            </th>
            <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 dark:text-gray-300 transition-colors">
              Value
            </th>
            <th className="px-4 py-3 w-16"></th>
          </tr>
        </thead>
        <tbody>
          {variableEntries.map(([key, value], index) => {
            const isVisible = visibleKeys.has(key)
            const displayValue = isVisible ? value : '•'.repeat(Math.min(value.length, 20))

            return (
              <tr
                key={key}
                className={`border-t border-gray-200 dark:border-[#3c3c3c] transition-colors ${
                  index % 2 === 0 ? 'bg-white dark:bg-[#1e1e1e]' : 'bg-gray-50 dark:bg-[#1a1a1a]'
                } hover:bg-gray-100 dark:hover:bg-[#2a2a2a]`}
              >
                <td className="px-4 py-3">
                  <code className="text-sm text-orange-400 font-mono">
                    {`{{${key}}}`}
                  </code>
                </td>
                <td className="px-4 py-3">
                  <code
                    className={`text-sm font-mono transition-colors ${
                      isVisible ? 'text-gray-700 dark:text-gray-200' : 'text-gray-600 dark:text-gray-500'
                    }`}
                  >
                    {displayValue}
                  </code>
                </td>
                <td className="px-4 py-3">
                  <button
                    onClick={() => toggleVisibility(key)}
                    className="text-gray-600 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
                    title={isVisible ? 'Hide value' : 'Show value'}
                  >
                    {isVisible ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

