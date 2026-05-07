export interface RevenueDailyRow {
  date: string;
  bookings_count: number;
  gross_revenue: number;
  travelhub_commission: number;
  net_revenue: number;
}

export interface RevenueReportPeriod {
  year: number;
  month: number;
  month_label: string;
}

export interface RevenueReportScope {
  hotel_id: string | null;
  hotel_name?: string | null;
  is_consolidated: boolean;
  included_statuses: string[];
}

export interface RevenueAuthorizedHotel {
  id: string;
  nombre: string;
}

export interface RevenueReportSummary {
  total_bookings: number;
  gross_revenue: number;
  travelhub_commission: number;
  net_revenue: number;
}

export interface RevenueReportResponse {
  period: RevenueReportPeriod;
  scope: RevenueReportScope;
  commission_percentage: number;
  authorized_hotels: RevenueAuthorizedHotel[];
  daily_rows: RevenueDailyRow[];
  summary: RevenueReportSummary;
}

export interface RevenueReportParams {
  month?: number;
  year?: number;
  hotel_id?: string;
}
