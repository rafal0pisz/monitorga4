'use client'
import dynamic from 'next/dynamic'

const EventsDetailPanel = dynamic(
  () => import('@/components/project/EventsDetailPanel'),
  { ssr: false }
)

export default EventsDetailPanel
