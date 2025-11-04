'use client'

import { useEffect } from 'react'
import { useEnvironmentStore } from '@/store/environmentStore'
import { useWorkspaceStore } from '@/store/workspaceStore'

export default function EnvironmentSwitcher() {
  const {
    environments,
    activeEnvironment,
    isLoading,
    fetchEnvironments,
    setActiveEnvironment,
  } = useEnvironmentStore()
  const { activeWorkspace } = useWorkspaceStore()

  useEffect(() => {
    if (activeWorkspace) {
      fetchEnvironments(activeWorkspace.id)
    } else {
      fetchEnvironments()
    }
  }, [activeWorkspace, fetchEnvironments])

  const handleChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const environmentId = e.target.value
    if (environmentId) {
      await setActiveEnvironment(environmentId)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 transition-colors">
        <span>Loading environments...</span>
      </div>
    )
  }

  if (environments.length === 0) {
    return (
      <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 transition-colors">
        <span>No environments</span>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm font-medium text-gray-700 dark:text-gray-300 transition-colors">Environment:</span>
      <select
        value={activeEnvironment?.id || ''}
        onChange={handleChange}
        className="bg-white dark:bg-[#1e1e1e] border border-gray-300 dark:border-[#3c3c3c] rounded px-3 py-1.5 text-sm text-gray-900 dark:text-gray-200 focus:outline-none focus:border-orange-500 min-w-[180px] transition-colors"
      >
        {environments.map((env) => (
          <option key={env.id} value={env.id}>
            {env.name} {env.isActive ? '✓' : ''}
          </option>
        ))}
      </select>
      {activeEnvironment && (
        <span className="text-xs text-gray-600 dark:text-gray-500 transition-colors">
          ({Object.keys(activeEnvironment.variables).length} variables)
        </span>
      )}
    </div>
  )
}

