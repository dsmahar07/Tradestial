// Review Status Service - Handles review status synchronization across the app

export type ReviewStatus = 'reviewed' | 'not-reviewed' | null

export interface ReviewStatusData {
  [tradeId: string]: ReviewStatus
}

class ReviewStatusService {
  private static instance: ReviewStatusService
  private data: ReviewStatusData = {}
  private listeners: Set<(data: ReviewStatusData) => void> = new Set()

  public static getInstance(): ReviewStatusService {
    if (!ReviewStatusService.instance) {
      ReviewStatusService.instance = new ReviewStatusService()
    }
    return ReviewStatusService.instance
  }

  // Subscribe to review status changes
  public subscribe(callback: (data: ReviewStatusData) => void): () => void {
    this.listeners.add(callback)
    // Immediately call with current data
    callback(this.data)
    return () => this.listeners.delete(callback)
  }

  // Notify all listeners of data changes
  private notify(): void {
    this.listeners.forEach(callback => callback(this.data))
  }

  // Get review status for a specific trade
  public getReviewStatus(tradeId: string): ReviewStatus {
    return this.data[tradeId] || null
  }

  // Get all review statuses
  public getAllReviewStatuses(): ReviewStatusData {
    return { ...this.data }
  }

  // Set review status for a specific trade
  public setReviewStatus(tradeId: string, status: ReviewStatus): void {
    if (status === null) {
      delete this.data[tradeId]
    } else {
      this.data[tradeId] = status
    }
    this.notify()
  }

  // Set review status for multiple trades (bulk operation)
  public setBulkReviewStatus(tradeIds: string[], status: ReviewStatus): void {
    tradeIds.forEach(tradeId => {
      if (status === null) {
        delete this.data[tradeId]
      } else {
        this.data[tradeId] = status
      }
    })
    this.notify()
  }

  // Clear all review statuses
  public clearAllReviewStatuses(): void {
    this.data = {}
    this.notify()
  }

  // Import review statuses from external source
  public importReviewStatuses(statuses: ReviewStatusData): void {
    this.data = { ...statuses }
    this.notify()
  }
}

export default ReviewStatusService.getInstance()