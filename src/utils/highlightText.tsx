import React from 'react'

/**
 * Highlights matching text in a string based on a search query
 * @param text - The text to highlight
 * @param query - The search query to highlight
 * @returns React element with highlighted text
 */
export function highlightText(text: string, query: string): React.ReactNode {
  if (!query || !text) {
    return text
  }

  const queryLower = query.toLowerCase()
  const textLower = text.toLowerCase()
  const index = textLower.indexOf(queryLower)

  if (index === -1) {
    return text
  }

  const beforeMatch = text.substring(0, index)
  const match = text.substring(index, index + query.length)
  const afterMatch = text.substring(index + query.length)

  return (
    <>
      {beforeMatch}
      <mark className="bg-yellow-300 dark:bg-yellow-600/50 text-gray-900 dark:text-gray-100 px-0.5 rounded">
        {match}
      </mark>
      {afterMatch}
    </>
  )
}

/**
 * Highlights all matching text occurrences in a string
 * @param text - The text to highlight
 * @param query - The search query to highlight
 * @returns React element with all matches highlighted
 */
export function highlightAllMatches(text: string, query: string): React.ReactNode {
  if (!query || !text) {
    return text
  }

  const queryLower = query.toLowerCase()
  const textLower = text.toLowerCase()
  const parts: React.ReactNode[] = []
  let lastIndex = 0
  let index = textLower.indexOf(queryLower, lastIndex)

  while (index !== -1) {
    // Add text before match
    if (index > lastIndex) {
      parts.push(text.substring(lastIndex, index))
    }

    // Add highlighted match
    const match = text.substring(index, index + query.length)
    parts.push(
      <mark
        key={index}
        className="bg-yellow-300 dark:bg-yellow-600/50 text-gray-900 dark:text-gray-100 px-0.5 rounded"
      >
        {match}
      </mark>
    )

    lastIndex = index + query.length
    index = textLower.indexOf(queryLower, lastIndex)
  }

  // Add remaining text
  if (lastIndex < text.length) {
    parts.push(text.substring(lastIndex))
  }

  return <>{parts}</>
}

