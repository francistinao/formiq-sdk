 export type CheckPatResponse = {
    user: {
      id: number
      firstName: string
      lastName: string
      email: string
      avatarUrl: string | null
      verificationStatus: 'VERIFIED' | 'NOT_VERIFIED' | null
      createdAt: Date
    }
    credits: {
      freeMonthlyRemaining: number
      starterPaidRemaining: number
      highVolumePaidRemaining: number
    }
  }