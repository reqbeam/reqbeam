import DocumentationGenerator from '@/components/DocumentationGenerator'

// Prevent static generation since this uses client-side context
export const dynamic = 'force-dynamic'
export const revalidate = 0

export default function DocumentationPage() {
  return <DocumentationGenerator />
}


