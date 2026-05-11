export type LanguageCode = 'en' | 'es' | 'pt';

export interface AdminTranslation {
  // Common / Language selector
  'common.language': string;
  'common.logout': string;
  'common.save': string;
  'common.cancel': string;
  'common.active': string;
  'common.saving': string;
  'common.retry': string;
  'common.export': string;
  'common.filter': string;
  'common.clearFilters': string;
  'common.loading': string;
  'common.needHelp': string;
  'common.name': string;

  // Sidebar
  'sidebar.dashboard': string;
  'sidebar.reservations': string;
  'sidebar.properties': string;
  'sidebar.guests': string;
  'sidebar.revenue': string;
  'sidebar.settings': string;

  // Footer
  'footer.copyright': string;
  'footer.privacyPolicy': string;
  'footer.termsOfService': string;
  'footer.security': string;

  // Login page
  'login.needHelp': string;
  'login.title': string;
  'login.subtitle': string;
  'login.email': string;
  'login.emailPlaceholder': string;
  'login.password': string;
  'login.passwordPlaceholder': string;
  'login.mfaCode': string;
  'login.mfaCodeHint': string;
  'login.rememberMe': string;
  'login.setupAdmin': string;
  'login.signIn': string;
  'login.verifySignIn': string;

  // Dashboard
  'dashboard.title': string;
  'dashboard.subtitle': string;
  'dashboard.period.last30': string;
  'dashboard.period.last7': string;
  'dashboard.period.last90': string;
  'dashboard.period.thisYear': string;
  'dashboard.kpi.totalReservations': string;
  'dashboard.kpi.fromLastMonth': string;
  'dashboard.kpi.monthlyRevenue': string;
  'dashboard.kpi.fromLastMonthRevenue': string;
  'dashboard.kpi.occupancyRate': string;
  'dashboard.kpi.aboveAverage': string;
  'dashboard.kpi.pendingConfirmations': string;
  'dashboard.kpi.awaitingApproval': string;
  'dashboard.kpi.needsAttention': string;
  'dashboard.revenue.title': string;
  'dashboard.revenue.subtitle': string;
  'dashboard.revenue.monthly': string;
  'dashboard.revenue.weekly': string;
  'dashboard.revenue.daily': string;
  'dashboard.recent.title': string;
  'dashboard.recent.subtitle': string;
  'dashboard.recent.viewAll': string;
  'dashboard.table.guest': string;
  'dashboard.table.property': string;
  'dashboard.table.checkIn': string;
  'dashboard.table.checkOut': string;
  'dashboard.table.amount': string;
  'dashboard.table.status': string;

  // Reservations page
  'reservations.title': string;
  'reservations.subtitle': string;
  'reservations.filter.bookingCode': string;
  'reservations.filter.searchCode': string;
  'reservations.filter.checkInFrom': string;
  'reservations.filter.checkInTo': string;
  'reservations.filter.status': string;
  'reservations.filter.allStatus': string;
  'reservations.filter.roomType': string;
  'reservations.filter.roomTypePlaceholder': string;
  'reservations.stats.total': string;
  'reservations.stats.confirmed': string;
  'reservations.stats.pending': string;
  'reservations.stats.cancelledRejected': string;
  'reservations.list.title': string;
  'reservations.list.subtitle': string;
  'reservations.list.loading': string;
  'reservations.list.noFound': string;
  'reservations.list.noFoundHint': string;
  'reservations.table.id': string;
  'reservations.table.guestId': string;
  'reservations.table.property': string;
  'reservations.table.checkIn': string;
  'reservations.table.checkOut': string;
  'reservations.table.nights': string;
  'reservations.table.amount': string;
  'reservations.table.status': string;
  'reservations.pagination.showing': string;
  'reservations.pagination.to': string;
  'reservations.pagination.of': string;
  'reservations.pagination.results': string;
  'reservations.perPage': string;

  // Rate Management (Settings) page
  'rateManagement.title': string;
  'rateManagement.subtitle': string;
  'rateManagement.rateHistory': string;
  'rateManagement.addRoomType': string;
  'rateManagement.selectProperty': string;
  'rateManagement.loadingHotels': string;
  'rateManagement.noHotels': string;
  'rateManagement.rooms': string;
  'rateManagement.noRooms': string;
  'rateManagement.capacity': string;
  'rateManagement.beds': string;
  'rateManagement.addRoom': string;
  'rateManagement.roomNumber': string;
  'rateManagement.ratePlans': string;
  'rateManagement.addPlan': string;
  'rateManagement.addRule': string;
  'rateManagement.currencyNote': string;
  'rateManagement.cancellationPolicy': string;
  'rateManagement.policy.flexible': string;
  'rateManagement.policy.flexibleDesc': string;
  'rateManagement.policy.moderate': string;
  'rateManagement.policy.moderateDesc': string;
  'rateManagement.policy.strict': string;
  'rateManagement.policy.strictDesc': string;
  'rateManagement.noRatePlans': string;
  'rateManagement.plan.name': string;
  'rateManagement.plan.namePlaceholder': string;
  'rateManagement.plan.description': string;
  'rateManagement.plan.descPlaceholder': string;
  'rateManagement.plan.currency': string;
  'rateManagement.plan.addTitle': string;
  'rateManagement.plan.saveTitle': string;
  'rateManagement.plan.rules': string;
  'rateManagement.plan.noRules': string;
  'rateManagement.plan.basePrice': string;
  'rateManagement.plan.minNights': string;
  'rateManagement.plan.dateFrom': string;
  'rateManagement.plan.dateTo': string;
  'rateManagement.plan.priority': string;
  'rateManagement.tipo.addTitle': string;
  'rateManagement.tipo.saveTipo': string;
  'rateManagement.tipo.capacidad': string;
  'rateManagement.tipo.namePlaceholder': string;
  'rateManagement.tipo.description': string;
  'rateManagement.tipo.optionalDesc': string;
  'rateManagement.room.addTitle': string;
  'rateManagement.room.saveRoom': string;
  'rateManagement.rule.addTitle': string;
  'rateManagement.rule.saveRule': string;
  'rateManagement.rule.basePriceLabel': string;
  'rateManagement.rule.minNightsLabel': string;
  'rateManagement.rule.dateFromLabel': string;
  'rateManagement.rule.dateToLabel': string;
  'rateManagement.rule.dateRangeLabel': string;
  'rateManagement.rule.priorityLabel': string;
  'rateManagement.table.roomNumber': string;
  'rateManagement.table.capacity': string;
  'rateManagement.table.beds': string;
  'rateManagement.table.actions': string;

  // Revenue Reports page
  'revenue.title': string;
  'revenue.subtitle': string;
  'revenue.exportPdf': string;
  'revenue.exportExcel': string;
  'revenue.filters': string;
  'revenue.filter.month': string;
  'revenue.filter.year': string;
  'revenue.filter.property': string;
  'revenue.filter.allProperties': string;
  'revenue.filter.scope': string;
  'revenue.filter.loadingProperties': string;
  'revenue.filter.consolidatedView': string;
  'revenue.filter.singleProperty': string;
  'revenue.filter.applyFilters': string;
  'revenue.filter.reset': string;
  'revenue.kpi.grossRevenue': string;
  'revenue.kpi.netRevenue': string;
  'revenue.kpi.totalBookings': string;
  'revenue.kpi.commission': string;
  'revenue.kpi.currentScope': string;
  'revenue.kpi.selectedMonthTotal': string;
  'revenue.kpi.afterCommission': string;
  'revenue.kpi.reservationsIncluded': string;
  'revenue.kpi.fixedCommission': string;
  'revenue.loading': string;
  'revenue.chart.dailyTrend': string;
  'revenue.chart.dailyTrendSubtitle': string;
  'revenue.chart.scopeBreakdown': string;
  'revenue.chart.grossVsCommission': string;
  'revenue.table.title': string;
  'revenue.table.date': string;
  'revenue.table.bookings': string;
  'revenue.table.grossRevenue': string;
  'revenue.table.commission': string;
  'revenue.table.netRevenue': string;
  'revenue.table.noData': string;
  'revenue.chart.btnMonth': string;
  'revenue.chart.btnGross': string;
  'revenue.chart.btnNet': string;
  'revenue.chart.btnSort': string;

  // Reviews & Ratings page
  'sidebar.reviews': string;
  'reviews.title': string;
  'reviews.subtitle': string;
  'reviews.buttons.export': string;
  'reviews.buttons.analytics': string;
  'reviews.buttons.filter': string;
  'reviews.buttons.retry': string;
  'reviews.kpi.average_rating': string;
  'reviews.kpi.out_of_5': string;
  'reviews.kpi.total_reviews': string;
  'reviews.kpi.positive': string;
  'reviews.kpi.response_rate': string;
  'reviews.filters.property': string;
  'reviews.filters.all_properties': string;
  'reviews.filters.rating': string;
  'reviews.filters.from_date': string;
  'reviews.filters.to_date': string;
  'reviews.filters.sentiment': string;
  'reviews.search_placeholder': string;
  'reviews.list.title': string;
  'reviews.list.subtitle': string;
  'reviews.room_label': string;
  'reviews.night': string;
  'reviews.nights': string;
  'reviews.verified_stay': string;
  'reviews.sentiments.positive': string;
  'reviews.sentiments.neutral': string;
  'reviews.sentiments.negative': string;
  'reviews.loading': string;
  'reviews.empty_state': string;
  'reviews.errors.loading_hotels': string;
  'reviews.errors.loading_reviews': string;
  'reviews.pagination.showing': string;
  'reviews.pagination.to': string;
  'reviews.pagination.of': string;
  'reviews.pagination.previous': string;
  'reviews.pagination.next': string;

  // Reservation Detail page
  'reservationDetail.title': string;
  'reservationDetail.subtitle': string;
  'reservationDetail.backToReservations': string;
  'reservationDetail.back': string;
  'reservationDetail.loading': string;
  'reservationDetail.unavailableTitle': string;
  'reservationDetail.unavailableHint': string;
  'reservationDetail.returnToReservations': string;
  'reservationDetail.reservationNumber': string;
  'reservationDetail.createdAt': string;
  'reservationDetail.reject': string;
  'reservationDetail.confirm': string;
  'reservationDetail.guestInformation': string;
  'reservationDetail.fullName': string;
  'reservationDetail.email': string;
  'reservationDetail.phone': string;
  'reservationDetail.notAvailableReservas': string;
  'reservationDetail.notAvailable': string;
  'reservationDetail.country': string;
  'reservationDetail.guests': string;
  'reservationDetail.sectionDetails': string;
  'reservationDetail.property': string;
  'reservationDetail.roomType': string;
  'reservationDetail.roomNumber': string;
  'reservationDetail.checkIn': string;
  'reservationDetail.checkOut': string;
  'reservationDetail.duration': string;
  'reservationDetail.nights': string;
  'reservationDetail.version': string;
  'reservationDetail.bookingTimeline': string;
  'reservationDetail.paymentStatus': string;
  'reservationDetail.noPaymentRecords': string;
  'reservationDetail.priceBreakdown': string;
  'reservationDetail.roomRate': string;
  'reservationDetail.discount': string;
  'reservationDetail.discountEarlyReservation': string;
  'reservationDetail.taxesAndCharges': string;
  'reservationDetail.estimatedTaxesFees': string;
  'reservationDetail.totalAmount': string;
  'reservationDetail.totalPaid': string;
  'reservationDetail.remainingBalance': string;
  'reservationDetail.quickActions': string;
  'reservationDetail.confirmReservationTitle': string;
  'reservationDetail.rejectReservationTitle': string;
  'reservationDetail.modalConfirmMessage': string;
  'reservationDetail.modalRejectMessage': string;
  'reservationDetail.reason': string;
  'reservationDetail.reasonPlaceholder': string;
  'reservationDetail.confirmAction': string;
  'reservationDetail.processing': string;
  'reservationDetail.error.reservationIdRequired': string;
  'reservationDetail.error.targetEstadoNotConfigured': string;
  'reservationDetail.error.reasonRequired': string;
  'reservationDetail.error.staleVersion': string;
  'reservationDetail.error.couldNotUpdate': string;
  'reservationDetail.error.couldNotLoad': string;
  'reservationDetail.success.confirmed': string;
  'reservationDetail.success.rejected': string;
  'reservationDetail.fallback.adminUser': string;
  'reservationDetail.fallback.hotelManager': string;
}

export const translations: Record<LanguageCode, AdminTranslation> = {
  en: {
    'common.language': 'Language',
    'common.logout': 'Logout',
    'common.save': 'Save',
    'common.cancel': 'Cancel',
    'common.active': 'Active',
    'common.saving': 'Saving...',
    'common.retry': 'Retry',
    'common.export': 'Export',
    'common.filter': 'Filter',
    'common.clearFilters': 'Clear filters',
    'common.loading': 'Loading...',
    'common.needHelp': 'Need Help?',
    'common.name': 'Name',

    'sidebar.dashboard': 'Dashboard',
    'sidebar.reservations': 'Reservations',
    'sidebar.properties': 'Properties',
    'sidebar.guests': 'Guests',
    'sidebar.revenue': 'Revenue',
    'sidebar.settings': 'Settings',

    'footer.copyright': '© 2026 TravelHub. All rights reserved.',
    'footer.privacyPolicy': 'Privacy Policy',
    'footer.termsOfService': 'Terms of Service',
    'footer.security': 'Security',

    'login.needHelp': 'Need Help?',
    'login.title': 'Admin Portal',
    'login.subtitle': 'Sign in to manage your hotel properties',
    'login.email': 'Email Address',
    'login.emailPlaceholder': 'admin@hotel.com',
    'login.password': 'Password',
    'login.passwordPlaceholder': 'Enter your password',
    'login.mfaCode': 'Verification Code',
    'login.mfaCodeHint': 'Enter the 6-digit code from your authenticator app',
    'login.rememberMe': 'Remember me',
    'login.setupAdmin': 'Setup Admin MFA',
    'login.signIn': 'Sign in to Admin Portal',
    'login.verifySignIn': 'Verify & Sign In',

    'dashboard.title': 'Dashboard Overview',
    'dashboard.subtitle': 'Monitor your hotel performance and reservations',
    'dashboard.period.last30': 'Last 30 days',
    'dashboard.period.last7': 'Last 7 days',
    'dashboard.period.last90': 'Last 90 days',
    'dashboard.period.thisYear': 'This year',
    'dashboard.kpi.totalReservations': 'Total Reservations',
    'dashboard.kpi.fromLastMonth': '+142 from last month',
    'dashboard.kpi.monthlyRevenue': 'Monthly Revenue',
    'dashboard.kpi.fromLastMonthRevenue': '+$6,850 from last month',
    'dashboard.kpi.occupancyRate': 'Occupancy Rate',
    'dashboard.kpi.aboveAverage': 'Above industry average',
    'dashboard.kpi.pendingConfirmations': 'Pending Confirmations',
    'dashboard.kpi.awaitingApproval': 'Awaiting approval',
    'dashboard.kpi.needsAttention': 'Needs attention',
    'dashboard.revenue.title': 'Revenue Overview',
    'dashboard.revenue.subtitle': 'Monthly revenue performance',
    'dashboard.revenue.monthly': 'Monthly',
    'dashboard.revenue.weekly': 'Weekly',
    'dashboard.revenue.daily': 'Daily',
    'dashboard.recent.title': 'Recent Reservations',
    'dashboard.recent.subtitle': 'Latest booking activity',
    'dashboard.recent.viewAll': 'View All',
    'dashboard.table.guest': 'Guest',
    'dashboard.table.property': 'Property',
    'dashboard.table.checkIn': 'Check-in',
    'dashboard.table.checkOut': 'Check-out',
    'dashboard.table.amount': 'Amount',
    'dashboard.table.status': 'Status',

    'reservations.title': 'All Reservations',
    'reservations.subtitle': 'Manage and monitor all hotel reservations',
    'reservations.filter.bookingCode': 'Booking Code',
    'reservations.filter.searchCode': 'Search code...',
    'reservations.filter.checkInFrom': 'Check-in From',
    'reservations.filter.checkInTo': 'Check-in To',
    'reservations.filter.status': 'Status',
    'reservations.filter.allStatus': 'All Status',
    'reservations.filter.roomType': 'Room Type',
    'reservations.filter.roomTypePlaceholder': 'e.g. Suite',
    'reservations.stats.total': 'Total Reservations',
    'reservations.stats.confirmed': 'Confirmed',
    'reservations.stats.pending': 'Pending',
    'reservations.stats.cancelledRejected': 'Cancelled / Rejected',
    'reservations.list.title': 'Reservations List',
    'reservations.list.subtitle': 'Complete list of all reservations',
    'reservations.list.loading': 'Loading reservations…',
    'reservations.list.noFound': 'No reservations found',
    'reservations.list.noFoundHint': 'Try adjusting your filters or check back later.',
    'reservations.table.id': 'ID',
    'reservations.table.guestId': 'Guest ID',
    'reservations.table.property': 'Property',
    'reservations.table.checkIn': 'Check-in',
    'reservations.table.checkOut': 'Check-out',
    'reservations.table.nights': 'Nights',
    'reservations.table.amount': 'Amount',
    'reservations.table.status': 'Status',
    'reservations.pagination.showing': 'Showing',
    'reservations.pagination.to': 'to',
    'reservations.pagination.of': 'of',
    'reservations.pagination.results': 'reservations',
    'reservations.perPage': 'per page',

    'rateManagement.title': 'Room & Rate Management',
    'rateManagement.subtitle': 'Manage rooms, rates, discounts, and cancellation policies',
    'rateManagement.rateHistory': 'Rate History',
    'rateManagement.addRoomType': 'Add Room Type',
    'rateManagement.selectProperty': 'Select Property',
    'rateManagement.loadingHotels': 'Loading hotels...',
    'rateManagement.noHotels': 'No hotels assigned to your account. Contact a super admin.',
    'rateManagement.rooms': 'Rooms',
    'rateManagement.noRooms': 'No rooms yet for this type. Add one above.',
    'rateManagement.capacity': 'Capacity',
    'rateManagement.beds': 'Beds',
    'rateManagement.addRoom': 'Add Room',
    'rateManagement.roomNumber': 'Room #',
    'rateManagement.ratePlans': 'Rate Plans',
    'rateManagement.addPlan': 'Add Plan',
    'rateManagement.addRule': 'Add Rule',
    'rateManagement.currencyNote': 'All plans are stored in USD',
    'rateManagement.cancellationPolicy': 'Cancellation Policy',
    'rateManagement.policy.flexible': 'Flexible',
    'rateManagement.policy.flexibleDesc': 'Free cancellation 24h before',
    'rateManagement.policy.moderate': 'Moderate',
    'rateManagement.policy.moderateDesc': 'Free cancellation 7 days before',
    'rateManagement.policy.strict': 'Strict',
    'rateManagement.policy.strictDesc': 'Non-refundable',
    'rateManagement.noRatePlans': 'No rate plans yet. Add one above.',
    'rateManagement.plan.name': 'Plan Name *',
    'rateManagement.plan.namePlaceholder': 'e.g. Standard, Weekday Special',
    'rateManagement.plan.description': 'Description',
    'rateManagement.plan.descPlaceholder': 'Optional',
    'rateManagement.plan.currency': 'Currency',
    'rateManagement.plan.addTitle': 'Add Rate Plan',
    'rateManagement.plan.saveTitle': 'Save Plan',
    'rateManagement.plan.rules': 'Pricing Rules',
    'rateManagement.plan.noRules': 'No pricing rules yet. Add one above.',
    'rateManagement.plan.basePrice': 'Base Price / Night ($)',
    'rateManagement.plan.minNights': 'Min Nights',
    'rateManagement.plan.dateFrom': 'Date From',
    'rateManagement.plan.dateTo': 'Date To',
    'rateManagement.plan.priority': 'Priority',
    'rateManagement.tipo.addTitle': 'Add Room Type',
    'rateManagement.tipo.saveTipo': 'Save Room Type',
    'rateManagement.tipo.capacidad': 'Capacity *',
    'rateManagement.tipo.namePlaceholder': 'e.g. Deluxe Suite',
    'rateManagement.tipo.description': 'Description',
    'rateManagement.tipo.optionalDesc': 'Optional description',
    'rateManagement.room.addTitle': 'Add Room',
    'rateManagement.room.saveRoom': 'Save Room',
    'rateManagement.rule.addTitle': 'Add Pricing Rule',
    'rateManagement.rule.saveRule': 'Save Rule',
    'rateManagement.rule.basePriceLabel': 'Base Price / Night ($) *',
    'rateManagement.rule.minNightsLabel': 'Min Nights',
    'rateManagement.rule.dateFromLabel': 'Date From',
    'rateManagement.rule.dateToLabel': 'Date To',
    'rateManagement.rule.dateRangeLabel': 'Date Range',
    'rateManagement.rule.priorityLabel': 'Priority',
    'rateManagement.table.roomNumber': 'Room #',
    'rateManagement.table.capacity': 'Capacity',
    'rateManagement.table.beds': 'Beds',
    'rateManagement.table.actions': 'Actions',

    'revenue.title': 'Revenue Reports',
    'revenue.subtitle': 'Monthly financial report by chart and daily table',
    'revenue.exportPdf': 'Export PDF',
    'revenue.exportExcel': 'Export Excel',
    'revenue.filters': 'Filters',
    'revenue.filter.month': 'Month',
    'revenue.filter.year': 'Year',
    'revenue.filter.property': 'Property',
    'revenue.filter.allProperties': 'All Authorized Properties',
    'revenue.filter.scope': 'Scope',
    'revenue.filter.loadingProperties': 'Loading properties...',
    'revenue.filter.consolidatedView': 'Consolidated view',
    'revenue.filter.singleProperty': 'Single property',
    'revenue.filter.applyFilters': 'Apply Filters',
    'revenue.filter.reset': 'Reset',
    'revenue.kpi.grossRevenue': 'Gross Revenue',
    'revenue.kpi.netRevenue': 'Net Revenue',
    'revenue.kpi.totalBookings': 'Total Bookings',
    'revenue.kpi.commission': 'TravelHub Commission',
    'revenue.kpi.currentScope': 'Current scope',
    'revenue.kpi.selectedMonthTotal': 'Selected month total',
    'revenue.kpi.afterCommission': 'After TravelHub commission',
    'revenue.kpi.reservationsIncluded': 'Reservations included in report',
    'revenue.kpi.fixedCommission': '% fixed commission',
    'revenue.loading': 'Loading revenue report for the selected month...',
    'revenue.chart.dailyTrend': 'Daily Revenue Trend',
    'revenue.chart.dailyTrendSubtitle': 'Daily revenue for the selected month',
    'revenue.chart.scopeBreakdown': 'Selected Scope Breakdown',
    'revenue.chart.grossVsCommission': 'Gross vs Commission vs Net',
    'revenue.table.title': 'Detailed Revenue Report',
    'revenue.table.date': 'Date',
    'revenue.table.bookings': 'Bookings',
    'revenue.table.grossRevenue': 'Gross Revenue',
    'revenue.table.commission': 'TravelHub Commission',
    'revenue.table.netRevenue': 'Net Revenue',
    'revenue.table.noData': 'No data available',
    'revenue.chart.btnMonth': 'Month',
    'revenue.chart.btnGross': 'Gross',
    'revenue.chart.btnNet': 'Net',
    'revenue.chart.btnSort': 'Sort',

    // Reviews & Ratings
    'sidebar.reviews': 'Reviews & Ratings',
    'reviews.title': 'Guest Reviews & Ratings',
    'reviews.subtitle': 'Monitor and analyze customer feedback across all properties',
    'reviews.buttons.export': 'Export Reviews',
    'reviews.buttons.analytics': 'Analytics',
    'reviews.buttons.filter': 'Filter',
    'reviews.buttons.retry': 'Retry',
    'reviews.kpi.average_rating': 'Average Rating',
    'reviews.kpi.out_of_5': 'out of 5 stars',
    'reviews.kpi.total_reviews': 'Total Reviews',
    'reviews.kpi.positive': 'Positive (4-5★)',
    'reviews.kpi.response_rate': 'Response Rate',
    'reviews.filters.property': 'Property',
    'reviews.filters.all_properties': 'All Properties',
    'reviews.filters.rating': 'Rating',
    'reviews.filters.from_date': 'From Date',
    'reviews.filters.to_date': 'To Date',
    'reviews.filters.sentiment': 'Sentiment',
    'reviews.search_placeholder': 'Search in comments...',
    'reviews.list.title': 'Guest Reviews',
    'reviews.list.subtitle': 'Complete list of all customer feedback',
    'reviews.room_label': 'Room',
    'reviews.night': 'night',
    'reviews.nights': 'nights',
    'reviews.verified_stay': 'Verified Stay',
    'reviews.sentiments.positive': 'Positive',
    'reviews.sentiments.neutral': 'Neutral',
    'reviews.sentiments.negative': 'Negative',
    'reviews.loading': 'Loading reviews...',
    'reviews.empty_state': 'No reviews found matching your filters',
    'reviews.errors.loading_hotels': 'Error loading properties',
    'reviews.errors.loading_reviews': 'Error loading reviews',
    'reviews.pagination.showing': 'Showing',
    'reviews.pagination.to': 'to',
    'reviews.pagination.of': 'of',
    'reviews.pagination.previous': 'Previous',
    'reviews.pagination.next': 'Next',

    'reservationDetail.title': 'Reservation Detail',
    'reservationDetail.subtitle': 'Review booking information and manage its status.',
    'reservationDetail.backToReservations': 'Back to reservations',
    'reservationDetail.back': 'Back',
    'reservationDetail.loading': 'Loading reservation detail...',
    'reservationDetail.unavailableTitle': 'Reservation detail unavailable',
    'reservationDetail.unavailableHint':
      'The page loaded, but the reservation payload did not include usable detail data.',
    'reservationDetail.returnToReservations': 'Return to reservations',
    'reservationDetail.reservationNumber': 'Reservation',
    'reservationDetail.createdAt': 'Created',
    'reservationDetail.reject': 'Reject',
    'reservationDetail.confirm': 'Confirm',
    'reservationDetail.guestInformation': 'Guest Information',
    'reservationDetail.fullName': 'Full Name',
    'reservationDetail.email': 'Email',
    'reservationDetail.phone': 'Phone',
    'reservationDetail.notAvailableReservas': 'Not available in reservas service',
    'reservationDetail.notAvailable': 'Not available',
    'reservationDetail.country': 'Country',
    'reservationDetail.guests': 'Guests',
    'reservationDetail.sectionDetails': 'Reservation Details',
    'reservationDetail.property': 'Property',
    'reservationDetail.roomType': 'Room Type',
    'reservationDetail.roomNumber': 'Room',
    'reservationDetail.checkIn': 'Check-in',
    'reservationDetail.checkOut': 'Check-out',
    'reservationDetail.duration': 'Duration',
    'reservationDetail.nights': 'nights',
    'reservationDetail.version': 'Version',
    'reservationDetail.bookingTimeline': 'Booking Timeline',
    'reservationDetail.paymentStatus': 'Payment Status',
    'reservationDetail.noPaymentRecords': 'No payment records found for this reservation.',
    'reservationDetail.priceBreakdown': 'Price Breakdown',
    'reservationDetail.roomRate': 'Room Rate',
    'reservationDetail.discount': 'Discount',
    'reservationDetail.discountEarlyReservation': 'Early booking discount',
    'reservationDetail.taxesAndCharges': 'Taxes and charges',
    'reservationDetail.estimatedTaxesFees': 'Estimated Taxes and Fees',
    'reservationDetail.totalAmount': 'Total Amount',
    'reservationDetail.totalPaid': 'Total Paid',
    'reservationDetail.remainingBalance': 'Remaining Balance',
    'reservationDetail.quickActions': 'Quick Actions',
    'reservationDetail.confirmReservationTitle': 'Confirm reservation',
    'reservationDetail.rejectReservationTitle': 'Reject reservation',
    'reservationDetail.modalConfirmMessage':
      'You are about to confirm this reservation. Please validate this action before continuing.',
    'reservationDetail.modalRejectMessage':
      'You are about to reject this reservation. Please validate this action before continuing.',
    'reservationDetail.reason': 'Reason',
    'reservationDetail.reasonPlaceholder': 'Provide reason for rejection',
    'reservationDetail.confirmAction': 'Confirm Action',
    'reservationDetail.processing': 'Processing...',
    'reservationDetail.error.reservationIdRequired': 'Reservation id is required.',
    'reservationDetail.error.targetEstadoNotConfigured':
      'Target reservation status is not configured.',
    'reservationDetail.error.reasonRequired': 'Reason is required when rejecting a reservation.',
    'reservationDetail.error.staleVersion':
      'Reservation was already updated by another channel. Refreshing latest state...',
    'reservationDetail.error.couldNotUpdate': 'Could not update reservation state.',
    'reservationDetail.error.couldNotLoad': 'Could not load reservation detail.',
    'reservationDetail.success.confirmed': 'Reservation confirmed successfully.',
    'reservationDetail.success.rejected': 'Reservation rejected successfully.',
    'reservationDetail.fallback.adminUser': 'Admin User',
    'reservationDetail.fallback.hotelManager': 'Hotel Manager',
  },

  es: {
    'common.language': 'Idioma',
    'common.logout': 'Cerrar sesión',
    'common.save': 'Guardar',
    'common.cancel': 'Cancelar',
    'common.active': 'Activo',
    'common.saving': 'Guardando...',
    'common.retry': 'Reintentar',
    'common.export': 'Exportar',
    'common.filter': 'Filtrar',
    'common.clearFilters': 'Limpiar filtros',
    'common.loading': 'Cargando...',
    'common.needHelp': '¿Necesitas ayuda?',
    'common.name': 'Nombre',

    'sidebar.dashboard': 'Panel',
    'sidebar.reservations': 'Reservas',
    'sidebar.properties': 'Propiedades',
    'sidebar.guests': 'Huéspedes',
    'sidebar.revenue': 'Ingresos',
    'sidebar.settings': 'Configuración',

    'footer.copyright': '© 2026 TravelHub. Todos los derechos reservados.',
    'footer.privacyPolicy': 'Política de privacidad',
    'footer.termsOfService': 'Términos de servicio',
    'footer.security': 'Seguridad',

    'login.needHelp': '¿Necesitas ayuda?',
    'login.title': 'Portal Admin',
    'login.subtitle': 'Inicia sesión para gestionar tus hoteles',
    'login.email': 'Correo electrónico',
    'login.emailPlaceholder': 'admin@hotel.com',
    'login.password': 'Contraseña',
    'login.passwordPlaceholder': 'Ingresa tu contraseña',
    'login.mfaCode': 'Código de verificación',
    'login.mfaCodeHint': 'Ingresa el código de 6 dígitos de tu app de autenticación',
    'login.rememberMe': 'Recordarme',
    'login.setupAdmin': 'Configurar MFA de Admin',
    'login.signIn': 'Ingresar al Portal Admin',
    'login.verifySignIn': 'Verificar e ingresar',

    'dashboard.title': 'Resumen del Panel',
    'dashboard.subtitle': 'Monitorea el rendimiento de tu hotel y las reservas',
    'dashboard.period.last30': 'Últimos 30 días',
    'dashboard.period.last7': 'Últimos 7 días',
    'dashboard.period.last90': 'Últimos 90 días',
    'dashboard.period.thisYear': 'Este año',
    'dashboard.kpi.totalReservations': 'Total de reservas',
    'dashboard.kpi.fromLastMonth': '+142 desde el mes pasado',
    'dashboard.kpi.monthlyRevenue': 'Ingresos mensuales',
    'dashboard.kpi.fromLastMonthRevenue': '+$6,850 desde el mes pasado',
    'dashboard.kpi.occupancyRate': 'Tasa de ocupación',
    'dashboard.kpi.aboveAverage': 'Por encima del promedio',
    'dashboard.kpi.pendingConfirmations': 'Confirmaciones pendientes',
    'dashboard.kpi.awaitingApproval': 'Esperando aprobación',
    'dashboard.kpi.needsAttention': 'Requiere atención',
    'dashboard.revenue.title': 'Resumen de ingresos',
    'dashboard.revenue.subtitle': 'Rendimiento mensual de ingresos',
    'dashboard.revenue.monthly': 'Mensual',
    'dashboard.revenue.weekly': 'Semanal',
    'dashboard.revenue.daily': 'Diario',
    'dashboard.recent.title': 'Reservas recientes',
    'dashboard.recent.subtitle': 'Última actividad de reservas',
    'dashboard.recent.viewAll': 'Ver todas',
    'dashboard.table.guest': 'Huésped',
    'dashboard.table.property': 'Propiedad',
    'dashboard.table.checkIn': 'Entrada',
    'dashboard.table.checkOut': 'Salida',
    'dashboard.table.amount': 'Monto',
    'dashboard.table.status': 'Estado',

    'reservations.title': 'Todas las reservas',
    'reservations.subtitle': 'Gestiona y monitorea todas las reservas del hotel',
    'reservations.filter.bookingCode': 'Código de reserva',
    'reservations.filter.searchCode': 'Buscar código...',
    'reservations.filter.checkInFrom': 'Entrada desde',
    'reservations.filter.checkInTo': 'Entrada hasta',
    'reservations.filter.status': 'Estado',
    'reservations.filter.allStatus': 'Todos los estados',
    'reservations.filter.roomType': 'Tipo de habitación',
    'reservations.filter.roomTypePlaceholder': 'Ej. Suite',
    'reservations.stats.total': 'Total de reservas',
    'reservations.stats.confirmed': 'Confirmadas',
    'reservations.stats.pending': 'Pendientes',
    'reservations.stats.cancelledRejected': 'Canceladas / Rechazadas',
    'reservations.list.title': 'Lista de reservas',
    'reservations.list.subtitle': 'Lista completa de todas las reservas',
    'reservations.list.loading': 'Cargando reservas…',
    'reservations.list.noFound': 'No se encontraron reservas',
    'reservations.list.noFoundHint': 'Intenta ajustar los filtros o vuelve más tarde.',
    'reservations.table.id': 'ID',
    'reservations.table.guestId': 'ID Huésped',
    'reservations.table.property': 'Propiedad',
    'reservations.table.checkIn': 'Entrada',
    'reservations.table.checkOut': 'Salida',
    'reservations.table.nights': 'Noches',
    'reservations.table.amount': 'Monto',
    'reservations.table.status': 'Estado',
    'reservations.pagination.showing': 'Mostrando',
    'reservations.pagination.to': 'a',
    'reservations.pagination.of': 'de',
    'reservations.pagination.results': 'reservas',
    'reservations.perPage': 'por página',

    'rateManagement.title': 'Gestión de habitaciones y tarifas',
    'rateManagement.subtitle':
      'Gestiona habitaciones, tarifas, descuentos y políticas de cancelación',
    'rateManagement.rateHistory': 'Historial de tarifas',
    'rateManagement.addRoomType': 'Agregar tipo de habitación',
    'rateManagement.selectProperty': 'Seleccionar propiedad',
    'rateManagement.loadingHotels': 'Cargando hoteles...',
    'rateManagement.noHotels': 'No tienes hoteles asignados. Contacta a un super administrador.',
    'rateManagement.rooms': 'Habitaciones',
    'rateManagement.noRooms': 'Aún no hay habitaciones para este tipo. Agrega una arriba.',
    'rateManagement.capacity': 'Capacidad',
    'rateManagement.beds': 'Camas',
    'rateManagement.addRoom': 'Agregar habitación',
    'rateManagement.roomNumber': 'Hab. #',
    'rateManagement.ratePlans': 'Planes tarifarios',
    'rateManagement.addPlan': 'Agregar plan',
    'rateManagement.addRule': 'Agregar regla',
    'rateManagement.currencyNote': 'Todos los planes se almacenan en USD',
    'rateManagement.cancellationPolicy': 'Política de cancelación',
    'rateManagement.policy.flexible': 'Flexible',
    'rateManagement.policy.flexibleDesc': 'Cancelación gratuita 24h antes',
    'rateManagement.policy.moderate': 'Moderada',
    'rateManagement.policy.moderateDesc': 'Cancelación gratuita 7 días antes',
    'rateManagement.policy.strict': 'Estricta',
    'rateManagement.policy.strictDesc': 'No reembolsable',
    'rateManagement.noRatePlans': 'Aún no hay planes tarifarios. Agrega uno arriba.',
    'rateManagement.plan.name': 'Nombre del plan *',
    'rateManagement.plan.namePlaceholder': 'Ej. Estándar, Especial entre semana',
    'rateManagement.plan.description': 'Descripción',
    'rateManagement.plan.descPlaceholder': 'Opcional',
    'rateManagement.plan.currency': 'Moneda',
    'rateManagement.plan.addTitle': 'Agregar plan tarifario',
    'rateManagement.plan.saveTitle': 'Guardar plan',
    'rateManagement.plan.rules': 'Reglas de precio',
    'rateManagement.plan.noRules': 'Aún no hay reglas de precio. Agrega una arriba.',
    'rateManagement.plan.basePrice': 'Precio base / noche ($)',
    'rateManagement.plan.minNights': 'Min. noches',
    'rateManagement.plan.dateFrom': 'Fecha desde',
    'rateManagement.plan.dateTo': 'Fecha hasta',
    'rateManagement.plan.priority': 'Prioridad',
    'rateManagement.tipo.addTitle': 'Agregar tipo de habitación',
    'rateManagement.tipo.saveTipo': 'Guardar tipo',
    'rateManagement.tipo.capacidad': 'Capacidad *',
    'rateManagement.tipo.namePlaceholder': 'ej. Suite Deluxe',
    'rateManagement.tipo.description': 'Descripción',
    'rateManagement.tipo.optionalDesc': 'Descripción opcional',
    'rateManagement.room.addTitle': 'Agregar habitación',
    'rateManagement.room.saveRoom': 'Guardar habitación',
    'rateManagement.rule.addTitle': 'Agregar regla de precio',
    'rateManagement.rule.saveRule': 'Guardar regla',
    'rateManagement.rule.basePriceLabel': 'Precio base / noche ($) *',
    'rateManagement.rule.minNightsLabel': 'Min. noches',
    'rateManagement.rule.dateFromLabel': 'Fecha desde',
    'rateManagement.rule.dateToLabel': 'Fecha hasta',
    'rateManagement.rule.dateRangeLabel': 'Rango de fechas',
    'rateManagement.rule.priorityLabel': 'Prioridad',
    'rateManagement.table.roomNumber': 'Hab. #',
    'rateManagement.table.capacity': 'Capacidad',
    'rateManagement.table.beds': 'Camas',
    'rateManagement.table.actions': 'Acciones',

    'revenue.title': 'Reportes de Ingresos',
    'revenue.subtitle': 'Reporte financiero mensual por gráfico y tabla diaria',
    'revenue.exportPdf': 'Exportar PDF',
    'revenue.exportExcel': 'Exportar Excel',
    'revenue.filters': 'Filtros',
    'revenue.filter.month': 'Mes',
    'revenue.filter.year': 'Año',
    'revenue.filter.property': 'Propiedad',
    'revenue.filter.allProperties': 'Todas las propiedades autorizadas',
    'revenue.filter.scope': 'Alcance',
    'revenue.filter.loadingProperties': 'Cargando propiedades...',
    'revenue.filter.consolidatedView': 'Vista consolidada',
    'revenue.filter.singleProperty': 'Propiedad individual',
    'revenue.filter.applyFilters': 'Aplicar filtros',
    'revenue.filter.reset': 'Restablecer',
    'revenue.kpi.grossRevenue': 'Ingreso Bruto',
    'revenue.kpi.netRevenue': 'Ingreso Neto',
    'revenue.kpi.totalBookings': 'Total de Reservas',
    'revenue.kpi.commission': 'Comisión TravelHub',
    'revenue.kpi.currentScope': 'Alcance actual',
    'revenue.kpi.selectedMonthTotal': 'Total del mes seleccionado',
    'revenue.kpi.afterCommission': 'Después de la comisión TravelHub',
    'revenue.kpi.reservationsIncluded': 'Reservas incluidas en el reporte',
    'revenue.kpi.fixedCommission': '% de comisión fija',
    'revenue.loading': 'Cargando reporte de ingresos del mes seleccionado...',
    'revenue.chart.dailyTrend': 'Tendencia de Ingresos Diarios',
    'revenue.chart.dailyTrendSubtitle': 'Ingresos diarios del mes seleccionado',
    'revenue.chart.scopeBreakdown': 'Desglose del Alcance Seleccionado',
    'revenue.chart.grossVsCommission': 'Bruto vs Comisión vs Neto',
    'revenue.table.title': 'Reporte Detallado de Ingresos',
    'revenue.table.date': 'Fecha',
    'revenue.table.bookings': 'Reservas',
    'revenue.table.grossRevenue': 'Ingreso Bruto',
    'revenue.table.commission': 'Comisión TravelHub',
    'revenue.table.netRevenue': 'Ingreso Neto',
    'revenue.table.noData': 'Sin datos disponibles',
    'revenue.chart.btnMonth': 'Mes',
    'revenue.chart.btnGross': 'Bruto',
    'revenue.chart.btnNet': 'Neto',
    'revenue.chart.btnSort': 'Ordenar',

    // Reseñas y Calificaciones
    'sidebar.reviews': 'Reseñas y Calificaciones',
    'reviews.title': 'Reseñas y Calificaciones de Huéspedes',
    'reviews.subtitle': 'Monitorea y analiza las opiniones de los clientes en todas las propiedades',
    'reviews.buttons.export': 'Exportar Reseñas',
    'reviews.buttons.analytics': 'Análisis',
    'reviews.buttons.filter': 'Filtro',
    'reviews.buttons.retry': 'Reintentar',
    'reviews.kpi.average_rating': 'Calificación Promedio',
    'reviews.kpi.out_of_5': 'de 5 estrellas',
    'reviews.kpi.total_reviews': 'Total de Reseñas',
    'reviews.kpi.positive': 'Positivo (4-5★)',
    'reviews.kpi.response_rate': 'Tasa de Respuesta',
    'reviews.filters.property': 'Propiedad',
    'reviews.filters.all_properties': 'Todas las Propiedades',
    'reviews.filters.rating': 'Calificación',
    'reviews.filters.from_date': 'Desde la Fecha',
    'reviews.filters.to_date': 'Hasta la Fecha',
    'reviews.filters.sentiment': 'Sentimiento',
    'reviews.search_placeholder': 'Buscar en comentarios...',
    'reviews.list.title': 'Reseñas de Huéspedes',
    'reviews.list.subtitle': 'Lista completa de todas las opiniones de clientes',
    'reviews.room_label': 'Habitación',
    'reviews.night': 'noche',
    'reviews.nights': 'noches',
    'reviews.verified_stay': 'Estancia Verificada',
    'reviews.sentiments.positive': 'Positivo',
    'reviews.sentiments.neutral': 'Neutral',
    'reviews.sentiments.negative': 'Negativo',
    'reviews.loading': 'Cargando reseñas...',
    'reviews.empty_state': 'No se encontraron reseñas que coincidan con tus filtros',
    'reviews.errors.loading_hotels': 'Error cargando propiedades',
    'reviews.errors.loading_reviews': 'Error cargando reseñas',
    'reviews.pagination.showing': 'Mostrando',
    'reviews.pagination.to': 'a',
    'reviews.pagination.of': 'de',
    'reviews.pagination.previous': 'Anterior',
    'reviews.pagination.next': 'Siguiente',

    'reservationDetail.title': 'Detalle de reserva',
    'reservationDetail.subtitle': 'Revisa la información de la reserva y gestiona su estado.',
    'reservationDetail.backToReservations': 'Volver a reservas',
    'reservationDetail.back': 'Volver',
    'reservationDetail.loading': 'Cargando detalle de la reserva...',
    'reservationDetail.unavailableTitle': 'Detalle de reserva no disponible',
    'reservationDetail.unavailableHint':
      'La página cargó, pero la respuesta no incluyó datos de detalle utilizables.',
    'reservationDetail.returnToReservations': 'Regresar a reservas',
    'reservationDetail.reservationNumber': 'Reserva',
    'reservationDetail.createdAt': 'Creada',
    'reservationDetail.reject': 'Rechazar',
    'reservationDetail.confirm': 'Confirmar',
    'reservationDetail.guestInformation': 'Información del huésped',
    'reservationDetail.fullName': 'Nombre Completo',
    'reservationDetail.email': 'Correo electrónico',
    'reservationDetail.phone': 'Teléfono',
    'reservationDetail.notAvailableReservas': 'No disponible en el servicio de reservas',
    'reservationDetail.notAvailable': 'No disponible',
    'reservationDetail.country': 'País',
    'reservationDetail.guests': 'Huéspedes',
    'reservationDetail.sectionDetails': 'Detalles de la reserva',
    'reservationDetail.property': 'Propiedad',
    'reservationDetail.roomType': 'Tipo de habitación',
    'reservationDetail.roomNumber': 'Habitación',
    'reservationDetail.checkIn': 'Entrada',
    'reservationDetail.checkOut': 'Salida',
    'reservationDetail.duration': 'Duración',
    'reservationDetail.nights': 'noches',
    'reservationDetail.version': 'Versión',
    'reservationDetail.bookingTimeline': 'Historial de la reserva',
    'reservationDetail.paymentStatus': 'Estado de pagos',
    'reservationDetail.noPaymentRecords': 'No hay registros de pago para esta reserva.',
    'reservationDetail.priceBreakdown': 'Desglose de precio',
    'reservationDetail.roomRate': 'Tarifa de habitación',
    'reservationDetail.discount': 'Descuento',
    'reservationDetail.discountEarlyReservation': 'Descuento por reserva anticipada',
    'reservationDetail.taxesAndCharges': 'Impuestos y cargos',
    'reservationDetail.estimatedTaxesFees': 'Impuestos y cargos estimados',
    'reservationDetail.totalAmount': 'Monto total',
    'reservationDetail.totalPaid': 'Total pagado',
    'reservationDetail.remainingBalance': 'Saldo pendiente',
    'reservationDetail.quickActions': 'Acciones rápidas',
    'reservationDetail.confirmReservationTitle': 'Confirmar reserva',
    'reservationDetail.rejectReservationTitle': 'Rechazar reserva',
    'reservationDetail.modalConfirmMessage':
      'Estás a punto de confirmar esta reserva. Valida esta acción antes de continuar.',
    'reservationDetail.modalRejectMessage':
      'Estás a punto de rechazar esta reserva. Valida esta acción antes de continuar.',
    'reservationDetail.reason': 'Motivo',
    'reservationDetail.reasonPlaceholder': 'Escribe el motivo del rechazo',
    'reservationDetail.confirmAction': 'Confirmar acción',
    'reservationDetail.processing': 'Procesando...',
    'reservationDetail.error.reservationIdRequired': 'El id de la reserva es obligatorio.',
    'reservationDetail.error.targetEstadoNotConfigured':
      'El estado objetivo de la reserva no está configurado.',
    'reservationDetail.error.reasonRequired':
      'El motivo es obligatorio cuando se rechaza una reserva.',
    'reservationDetail.error.staleVersion':
      'La reserva ya fue actualizada por otro canal. Refrescando el estado más reciente...',
    'reservationDetail.error.couldNotUpdate': 'No se pudo actualizar el estado de la reserva.',
    'reservationDetail.error.couldNotLoad': 'No se pudo cargar el detalle de la reserva.',
    'reservationDetail.success.confirmed': 'Reserva confirmada con éxito.',
    'reservationDetail.success.rejected': 'Reserva rechazada con éxito.',
    'reservationDetail.fallback.adminUser': 'Usuario administrador',
    'reservationDetail.fallback.hotelManager': 'Administrador del hotel',
  },

  pt: {
    'common.language': 'Idioma',
    'common.logout': 'Sair',
    'common.save': 'Salvar',
    'common.cancel': 'Cancelar',
    'common.active': 'Ativo',
    'common.saving': 'Salvando...',
    'common.retry': 'Tentar novamente',
    'common.export': 'Exportar',
    'common.filter': 'Filtrar',
    'common.clearFilters': 'Limpar filtros',
    'common.loading': 'Carregando...',
    'common.needHelp': 'Precisa de ajuda?',
    'common.name': 'Nome',

    'sidebar.dashboard': 'Painel',
    'sidebar.reservations': 'Reservas',
    'sidebar.properties': 'Propriedades',
    'sidebar.guests': 'Hóspedes',
    'sidebar.revenue': 'Receita',
    'sidebar.settings': 'Configurações',

    'footer.copyright': '© 2026 TravelHub. Todos os direitos reservados.',
    'footer.privacyPolicy': 'Política de privacidade',
    'footer.termsOfService': 'Termos de serviço',
    'footer.security': 'Segurança',

    'login.needHelp': 'Precisa de ajuda?',
    'login.title': 'Portal Admin',
    'login.subtitle': 'Entre para gerenciar suas propriedades de hotel',
    'login.email': 'Endereço de e-mail',
    'login.emailPlaceholder': 'admin@hotel.com',
    'login.password': 'Senha',
    'login.passwordPlaceholder': 'Digite sua senha',
    'login.mfaCode': 'Código de verificação',
    'login.mfaCodeHint': 'Digite o código de 6 dígitos do seu aplicativo autenticador',
    'login.rememberMe': 'Lembrar-me',
    'login.setupAdmin': 'Configurar MFA Admin',
    'login.signIn': 'Entrar no Portal Admin',
    'login.verifySignIn': 'Verificar e entrar',

    'dashboard.title': 'Visão geral do painel',
    'dashboard.subtitle': 'Monitore o desempenho do seu hotel e as reservas',
    'dashboard.period.last30': 'Últimos 30 dias',
    'dashboard.period.last7': 'Últimos 7 dias',
    'dashboard.period.last90': 'Últimos 90 dias',
    'dashboard.period.thisYear': 'Este ano',
    'dashboard.kpi.totalReservations': 'Total de reservas',
    'dashboard.kpi.fromLastMonth': '+142 desde o mês passado',
    'dashboard.kpi.monthlyRevenue': 'Receita mensal',
    'dashboard.kpi.fromLastMonthRevenue': '+$6.850 desde o mês passado',
    'dashboard.kpi.occupancyRate': 'Taxa de ocupação',
    'dashboard.kpi.aboveAverage': 'Acima da média do setor',
    'dashboard.kpi.pendingConfirmations': 'Confirmações pendentes',
    'dashboard.kpi.awaitingApproval': 'Aguardando aprovação',
    'dashboard.kpi.needsAttention': 'Requer atenção',
    'dashboard.revenue.title': 'Visão geral de receita',
    'dashboard.revenue.subtitle': 'Desempenho mensal de receita',
    'dashboard.revenue.monthly': 'Mensal',
    'dashboard.revenue.weekly': 'Semanal',
    'dashboard.revenue.daily': 'Diário',
    'dashboard.recent.title': 'Reservas recentes',
    'dashboard.recent.subtitle': 'Última atividade de reservas',
    'dashboard.recent.viewAll': 'Ver todas',
    'dashboard.table.guest': 'Hóspede',
    'dashboard.table.property': 'Propriedade',
    'dashboard.table.checkIn': 'Check-in',
    'dashboard.table.checkOut': 'Check-out',
    'dashboard.table.amount': 'Valor',
    'dashboard.table.status': 'Status',

    'reservations.title': 'Todas as reservas',
    'reservations.subtitle': 'Gerencie e monitore todas as reservas do hotel',
    'reservations.filter.bookingCode': 'Código de reserva',
    'reservations.filter.searchCode': 'Buscar código...',
    'reservations.filter.checkInFrom': 'Check-in a partir de',
    'reservations.filter.checkInTo': 'Check-in até',
    'reservations.filter.status': 'Status',
    'reservations.filter.allStatus': 'Todos os status',
    'reservations.filter.roomType': 'Tipo de quarto',
    'reservations.filter.roomTypePlaceholder': 'Ex. Suite',
    'reservations.stats.total': 'Total de reservas',
    'reservations.stats.confirmed': 'Confirmadas',
    'reservations.stats.pending': 'Pendentes',
    'reservations.stats.cancelledRejected': 'Canceladas / Rejeitadas',
    'reservations.list.title': 'Lista de reservas',
    'reservations.list.subtitle': 'Lista completa de todas as reservas',
    'reservations.list.loading': 'Carregando reservas…',
    'reservations.list.noFound': 'Nenhuma reserva encontrada',
    'reservations.list.noFoundHint': 'Tente ajustar os filtros ou verifique mais tarde.',
    'reservations.table.id': 'ID',
    'reservations.table.guestId': 'ID Hóspede',
    'reservations.table.property': 'Propriedade',
    'reservations.table.checkIn': 'Check-in',
    'reservations.table.checkOut': 'Check-out',
    'reservations.table.nights': 'Noites',
    'reservations.table.amount': 'Valor',
    'reservations.table.status': 'Status',
    'reservations.pagination.showing': 'Mostrando',
    'reservations.pagination.to': 'a',
    'reservations.pagination.of': 'de',
    'reservations.pagination.results': 'reservas',
    'reservations.perPage': 'por página',

    'rateManagement.title': 'Gestão de quartos e tarifas',
    'rateManagement.subtitle': 'Gerencie quartos, tarifas, descontos e políticas de cancelamento',
    'rateManagement.rateHistory': 'Histórico de tarifas',
    'rateManagement.addRoomType': 'Adicionar tipo de quarto',
    'rateManagement.selectProperty': 'Selecionar propriedade',
    'rateManagement.loadingHotels': 'Carregando hotéis...',
    'rateManagement.noHotels': 'Nenhum hotel atribuído à sua conta. Contate um super admin.',
    'rateManagement.rooms': 'Quartos',
    'rateManagement.noRooms': 'Nenhum quarto ainda para este tipo. Adicione um acima.',
    'rateManagement.capacity': 'Capacidade',
    'rateManagement.beds': 'Camas',
    'rateManagement.addRoom': 'Adicionar quarto',
    'rateManagement.roomNumber': 'Quarto #',
    'rateManagement.ratePlans': 'Planos tarifários',
    'rateManagement.addPlan': 'Adicionar plano',
    'rateManagement.addRule': 'Adicionar regra',
    'rateManagement.currencyNote': 'Todos os planos são armazenados em USD',
    'rateManagement.cancellationPolicy': 'Política de cancelamento',
    'rateManagement.policy.flexible': 'Flexível',
    'rateManagement.policy.flexibleDesc': 'Cancelamento grátis 24h antes',
    'rateManagement.policy.moderate': 'Moderada',
    'rateManagement.policy.moderateDesc': 'Cancelamento grátis 7 dias antes',
    'rateManagement.policy.strict': 'Rígida',
    'rateManagement.policy.strictDesc': 'Não reembolsável',
    'rateManagement.noRatePlans': 'Nenhum plano tarifário ainda. Adicione um acima.',
    'rateManagement.plan.name': 'Nome do plano *',
    'rateManagement.plan.namePlaceholder': 'Ex. Padrão, Especial dias úteis',
    'rateManagement.plan.description': 'Descrição',
    'rateManagement.plan.descPlaceholder': 'Opcional',
    'rateManagement.plan.currency': 'Moeda',
    'rateManagement.plan.addTitle': 'Adicionar plano tarifário',
    'rateManagement.plan.saveTitle': 'Salvar plano',
    'rateManagement.plan.rules': 'Regras de preço',
    'rateManagement.plan.noRules': 'Nenhuma regra de preço ainda. Adicione uma acima.',
    'rateManagement.plan.basePrice': 'Preço base / noite ($)',
    'rateManagement.plan.minNights': 'Noites mínimas',
    'rateManagement.plan.dateFrom': 'Data de início',
    'rateManagement.plan.dateTo': 'Data de fim',
    'rateManagement.plan.priority': 'Prioridade',
    'rateManagement.tipo.addTitle': 'Adicionar tipo de quarto',
    'rateManagement.tipo.saveTipo': 'Salvar tipo',
    'rateManagement.tipo.capacidad': 'Capacidade *',
    'rateManagement.tipo.namePlaceholder': 'ex. Suite Deluxe',
    'rateManagement.tipo.description': 'Descrição',
    'rateManagement.tipo.optionalDesc': 'Descrição opcional',
    'rateManagement.room.addTitle': 'Adicionar quarto',
    'rateManagement.room.saveRoom': 'Salvar quarto',
    'rateManagement.rule.addTitle': 'Adicionar regra de preço',
    'rateManagement.rule.saveRule': 'Salvar regra',
    'rateManagement.rule.basePriceLabel': 'Preço base / noite ($) *',
    'rateManagement.rule.minNightsLabel': 'Noites mínimas',
    'rateManagement.rule.dateFromLabel': 'Data de início',
    'rateManagement.rule.dateToLabel': 'Data de fim',
    'rateManagement.rule.dateRangeLabel': 'Intervalo de datas',
    'rateManagement.rule.priorityLabel': 'Prioridade',
    'rateManagement.table.roomNumber': 'Quarto #',
    'rateManagement.table.capacity': 'Capacidade',
    'rateManagement.table.beds': 'Camas',
    'rateManagement.table.actions': 'Ações',

    'revenue.title': 'Relatórios de Receita',
    'revenue.subtitle': 'Relatório financeiro mensal por gráfico e tabela diária',
    'revenue.exportPdf': 'Exportar PDF',
    'revenue.exportExcel': 'Exportar Excel',
    'revenue.filters': 'Filtros',
    'revenue.filter.month': 'Mês',
    'revenue.filter.year': 'Ano',
    'revenue.filter.property': 'Propriedade',
    'revenue.filter.allProperties': 'Todas as propriedades autorizadas',
    'revenue.filter.scope': 'Escopo',
    'revenue.filter.loadingProperties': 'Carregando propriedades...',
    'revenue.filter.consolidatedView': 'Visão consolidada',
    'revenue.filter.singleProperty': 'Propriedade individual',
    'revenue.filter.applyFilters': 'Aplicar filtros',
    'revenue.filter.reset': 'Redefinir',
    'revenue.kpi.grossRevenue': 'Receita Bruta',
    'revenue.kpi.netRevenue': 'Receita Líquida',
    'revenue.kpi.totalBookings': 'Total de Reservas',
    'revenue.kpi.commission': 'Comissão TravelHub',
    'revenue.kpi.currentScope': 'Escopo atual',
    'revenue.kpi.selectedMonthTotal': 'Total do mês selecionado',
    'revenue.kpi.afterCommission': 'Após comissão TravelHub',
    'revenue.kpi.reservationsIncluded': 'Reservas incluídas no relatório',
    'revenue.kpi.fixedCommission': '% de comissão fixa',
    'revenue.loading': 'Carregando relatório de receita do mês selecionado...',
    'revenue.chart.dailyTrend': 'Tendência de Receita Diária',
    'revenue.chart.dailyTrendSubtitle': 'Receita diária do mês selecionado',
    'revenue.chart.scopeBreakdown': 'Detalhamento do Escopo Selecionado',
    'revenue.chart.grossVsCommission': 'Bruto vs Comissão vs Líquido',
    'revenue.table.title': 'Relatório Detalhado de Receita',
    'revenue.table.date': 'Data',
    'revenue.table.bookings': 'Reservas',
    'revenue.table.grossRevenue': 'Receita Bruta',
    'revenue.table.commission': 'Comissão TravelHub',
    'revenue.table.netRevenue': 'Receita Líquida',
    'revenue.table.noData': 'Nenhum dado disponível',
    'revenue.chart.btnMonth': 'Mês',
    'revenue.chart.btnGross': 'Bruto',
    'revenue.chart.btnNet': 'Líquido',
    'revenue.chart.btnSort': 'Ordenar',

    // Avaliações e Classificações
    'sidebar.reviews': 'Avaliações e Classificações',
    'reviews.title': 'Avaliações e Classificações de Hóspedes',
    'reviews.subtitle': 'Monitore e analise o feedback dos clientes em todas as propriedades',
    'reviews.buttons.export': 'Exportar Avaliações',
    'reviews.buttons.analytics': 'Análise',
    'reviews.buttons.filter': 'Filtro',
    'reviews.buttons.retry': 'Tentar Novamente',
    'reviews.kpi.average_rating': 'Classificação Média',
    'reviews.kpi.out_of_5': 'de 5 estrelas',
    'reviews.kpi.total_reviews': 'Total de Avaliações',
    'reviews.kpi.positive': 'Positivo (4-5★)',
    'reviews.kpi.response_rate': 'Taxa de Resposta',
    'reviews.filters.property': 'Propriedade',
    'reviews.filters.all_properties': 'Todas as Propriedades',
    'reviews.filters.rating': 'Classificação',
    'reviews.filters.from_date': 'Data Inicial',
    'reviews.filters.to_date': 'Data Final',
    'reviews.filters.sentiment': 'Sentimento',
    'reviews.search_placeholder': 'Procurar nos comentários...',
    'reviews.list.title': 'Avaliações de Hóspedes',
    'reviews.list.subtitle': 'Lista completa de todos os comentários de clientes',
    'reviews.room_label': 'Quarto',
    'reviews.night': 'noite',
    'reviews.nights': 'noites',
    'reviews.verified_stay': 'Estadia Verificada',
    'reviews.sentiments.positive': 'Positivo',
    'reviews.sentiments.neutral': 'Neutro',
    'reviews.sentiments.negative': 'Negativo',
    'reviews.loading': 'Carregando avaliações...',
    'reviews.empty_state': 'Nenhuma avaliação encontrada correspondendo aos seus filtros',
    'reviews.errors.loading_hotels': 'Erro ao carregar propriedades',
    'reviews.errors.loading_reviews': 'Erro ao carregar avaliações',
    'reviews.pagination.showing': 'Exibindo',
    'reviews.pagination.to': 'para',
    'reviews.pagination.of': 'de',
    'reviews.pagination.previous': 'Anterior',
    'reviews.pagination.next': 'Próximo',

    'reservationDetail.title': 'Detalhe da reserva',
    'reservationDetail.subtitle': 'Revise as informações da reserva e gerencie seu status.',
    'reservationDetail.backToReservations': 'Voltar para reservas',
    'reservationDetail.back': 'Voltar',
    'reservationDetail.loading': 'Carregando detalhe da reserva...',
    'reservationDetail.unavailableTitle': 'Detalhe da reserva indisponível',
    'reservationDetail.unavailableHint':
      'A página foi carregada, mas o retorno não incluiu dados de detalhe utilizáveis.',
    'reservationDetail.returnToReservations': 'Retornar para reservas',
    'reservationDetail.reservationNumber': 'Reserva',
    'reservationDetail.createdAt': 'Criada em',
    'reservationDetail.reject': 'Rejeitar',
    'reservationDetail.confirm': 'Confirmar',
    'reservationDetail.guestInformation': 'Informações do hóspede',
    'reservationDetail.fullName': 'Nome Completo',
    'reservationDetail.email': 'E-mail',
    'reservationDetail.phone': 'Telefone',
    'reservationDetail.notAvailableReservas': 'Não disponível no serviço de reservas',
    'reservationDetail.notAvailable': 'Não disponível',
    'reservationDetail.country': 'País',
    'reservationDetail.guests': 'Hóspedes',
    'reservationDetail.sectionDetails': 'Detalhes da reserva',
    'reservationDetail.property': 'Propriedade',
    'reservationDetail.roomType': 'Tipo de quarto',
    'reservationDetail.roomNumber': 'Quarto',
    'reservationDetail.checkIn': 'Check-in',
    'reservationDetail.checkOut': 'Check-out',
    'reservationDetail.duration': 'Duração',
    'reservationDetail.nights': 'noites',
    'reservationDetail.version': 'Versão',
    'reservationDetail.bookingTimeline': 'Linha do tempo da reserva',
    'reservationDetail.paymentStatus': 'Status de pagamento',
    'reservationDetail.noPaymentRecords': 'Nenhum registro de pagamento encontrado para esta reserva.',
    'reservationDetail.priceBreakdown': 'Resumo de preços',
    'reservationDetail.roomRate': 'Tarifa do quarto',
    'reservationDetail.discount': 'Desconto',
    'reservationDetail.discountEarlyReservation': 'Desconto por reserva antecipada',
    'reservationDetail.taxesAndCharges': 'Impostos e taxas',
    'reservationDetail.estimatedTaxesFees': 'Impostos e taxas estimados',
    'reservationDetail.totalAmount': 'Valor total',
    'reservationDetail.totalPaid': 'Total pago',
    'reservationDetail.remainingBalance': 'Saldo restante',
    'reservationDetail.quickActions': 'Ações rápidas',
    'reservationDetail.confirmReservationTitle': 'Confirmar reserva',
    'reservationDetail.rejectReservationTitle': 'Rejeitar reserva',
    'reservationDetail.modalConfirmMessage':
      'Você está prestes a confirmar esta reserva. Valide esta ação antes de continuar.',
    'reservationDetail.modalRejectMessage':
      'Você está prestes a rejeitar esta reserva. Valide esta ação antes de continuar.',
    'reservationDetail.reason': 'Motivo',
    'reservationDetail.reasonPlaceholder': 'Informe o motivo da rejeição',
    'reservationDetail.confirmAction': 'Confirmar ação',
    'reservationDetail.processing': 'Processando...',
    'reservationDetail.error.reservationIdRequired': 'O id da reserva é obrigatório.',
    'reservationDetail.error.targetEstadoNotConfigured':
      'O status de destino da reserva não está configurado.',
    'reservationDetail.error.reasonRequired':
      'O motivo é obrigatório ao rejeitar uma reserva.',
    'reservationDetail.error.staleVersion':
      'A reserva já foi atualizada por outro canal. Atualizando o estado mais recente...',
    'reservationDetail.error.couldNotUpdate': 'Não foi possível atualizar o status da reserva.',
    'reservationDetail.error.couldNotLoad': 'Não foi possível carregar o detalhe da reserva.',
    'reservationDetail.success.confirmed': 'Reserva confirmada com sucesso.',
    'reservationDetail.success.rejected': 'Reserva rejeitada com sucesso.',
    'reservationDetail.fallback.adminUser': 'Usuário administrador',
    'reservationDetail.fallback.hotelManager': 'Gerente do hotel',
  },
};
