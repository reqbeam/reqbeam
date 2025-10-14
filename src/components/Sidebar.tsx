'use client'

import { useState } from 'react'
import { Plus, Folder, History, Settings, ChevronRight, ChevronDown } from 'lucide-react'
import Collections from './Collections'
import Environments from './Environments'

interface SidebarProps {
  onNewRequest: () => void
}

export default function Sidebar({ onNewRequest }: SidebarProps) {
  const [expandedSections, setExpandedSections] = useState({
    collections: true,
    history: true,
    environments: false,
  })

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }))
  }

  return (
    <div className="w-64 bg-gray-800 text-white flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-700">
        <div className="mb-3">
          <h2 className="text-lg font-semibold text-white">API Tester</h2>
          <p className="text-xs text-gray-400">Postman Clone</p>
        </div>
        <button
          onClick={onNewRequest}
          className="w-full bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-md flex items-center justify-center space-x-2 transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" />
          <span>New Request</span>
        </button>
      </div>

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto">
        {/* Collections */}
        <div className="border-b border-gray-700">
          <button
            onClick={() => toggleSection('collections')}
            className="w-full px-4 py-3 text-left flex items-center justify-between hover:bg-gray-700 transition-colors group"
          >
            <div className="flex items-center space-x-2">
              <Folder className="w-4 h-4 text-gray-300 group-hover:text-white" />
              <span className="font-medium">Collections</span>
            </div>
            {expandedSections.collections ? (
              <ChevronDown className="w-4 h-4 text-gray-400" />
            ) : (
              <ChevronRight className="w-4 h-4 text-gray-400" />
            )}
          </button>
          {expandedSections.collections && (
            <div className="px-2 pb-2">
              <Collections />
            </div>
          )}
        </div>

        {/* History */}
        <div className="border-b border-gray-700">
          <button
            onClick={() => toggleSection('history')}
            className="w-full px-4 py-3 text-left flex items-center justify-between hover:bg-gray-700 transition-colors group"
          >
            <div className="flex items-center space-x-2">
              <History className="w-4 h-4 text-gray-300 group-hover:text-white" />
              <span className="font-medium">History</span>
            </div>
            {expandedSections.history ? (
              <ChevronDown className="w-4 h-4 text-gray-400" />
            ) : (
              <ChevronRight className="w-4 h-4 text-gray-400" />
            )}
          </button>
          {expandedSections.history && (
            <div className="px-4 pb-2">
              <div className="text-sm text-gray-400 py-4 text-center">
                <History className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p>No recent requests</p>
                <p className="text-xs mt-1">Your request history will appear here</p>
              </div>
            </div>
          )}
        </div>

        {/* Environments */}
        <div className="border-b border-gray-700">
          <button
            onClick={() => toggleSection('environments')}
            className="w-full px-4 py-3 text-left flex items-center justify-between hover:bg-gray-700 transition-colors group"
          >
            <div className="flex items-center space-x-2">
              <Settings className="w-4 h-4 text-gray-300 group-hover:text-white" />
              <span className="font-medium">Environments</span>
            </div>
            {expandedSections.environments ? (
              <ChevronDown className="w-4 h-4 text-gray-400" />
            ) : (
              <ChevronRight className="w-4 h-4 text-gray-400" />
            )}
          </button>
          {expandedSections.environments && (
            <div className="px-2 pb-2">
              <Environments />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
