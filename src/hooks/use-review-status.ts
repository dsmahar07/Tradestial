import { useState, useEffect } from 'react'
import ReviewStatusService, { ReviewStatus, ReviewStatusData } from '@/services/review-status.service'

export function useReviewStatus() {
  const [reviewStatuses, setReviewStatuses] = useState<ReviewStatusData>({})

  useEffect(() => {
    // Subscribe to review status changes
    const unsubscribe = ReviewStatusService.subscribe((data) => {
      setReviewStatuses({...data}) // Force new object reference
    })

    return unsubscribe
  }, [])

  const getReviewStatus = (tradeId: string): ReviewStatus => {
    return reviewStatuses[tradeId] || null
  }

  const setReviewStatus = (tradeId: string, status: ReviewStatus) => {
    ReviewStatusService.setReviewStatus(tradeId, status)
  }

  return {
    reviewStatuses,
    getReviewStatus,
    setReviewStatus,
    setBulkReviewStatus: (tradeIds: string[], status: ReviewStatus) => ReviewStatusService.setBulkReviewStatus(tradeIds, status),
    clearAllReviewStatuses: () => ReviewStatusService.clearAllReviewStatuses(),
    importReviewStatuses: (statuses: ReviewStatusData) => ReviewStatusService.importReviewStatuses(statuses)
  }
}