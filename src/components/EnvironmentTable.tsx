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
      <div className="text-center py-8 text-gray-400">
        <p>No variables defined</p>
        <p className="text-sm mt-1">Add variables to use in your requests</p>
      </div>
    )
  }

  return (
    <div className="border border-[#3c3c3c] rounded overflow-hidden">
      <table className="w-full">
        <thead className="bg-[#2a2a2a]">
          <tr>
            <th className="px-4 py-3 text-left text-sm font-medium text-gray-300">
              Name
            </th>
            <th className="px-4 py-3 text-left text-sm font-medium text-gray-300">
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
                className={`border-t border-[#3c3c3c] ${
                  index % 2 === 0 ? 'bg-[#1e1e1e]' : 'bg-[#1a1a1a]'
                } hover:bg-[#2a2a2a] transition-colors`}
              >
                <td className="px-4 py-3">
                  <code className="text-sm text-orange-400 font-mono">
                    {`{{${key}}}`}
                  </code>
                </td>
                <td className="px-4 py-3">
                  <code
                    className={`text-sm font-mono ${
                      isVisible ? 'text-gray-200' : 'text-gray-500'
                    }`}
                  >
                    {displayValue}
                  </code>
                </td>
                <td className="px-4 py-3">
                  <button
                    onClick={() => toggleVisibility(key)}
                    className="text-gray-400 hover:text-gray-200 transition-colors"
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

