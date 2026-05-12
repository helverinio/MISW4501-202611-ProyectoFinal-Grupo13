from typing import Dict, List, Optional
from datetime import datetime
from app.domain.entities.admin_review import AdminReview
from app.domain.repositories.comentario_hotel_repository import ComentarioHotelRepository


class ListAdminReviewsUseCase:
    """
    Use case for listing reviews with admin-level filtering, sorting, and pagination.
    Handles authorization scoping to authorized hotels and enriches data with guest/hotel/room details.
    """

    def __init__(self, repository: ComentarioHotelRepository):
        self.repository = repository

    def execute(
        self,
        authorized_hotel_ids: List[str],
        rating_filter: Optional[int] = None,
        date_from: Optional[datetime] = None,
        date_to: Optional[datetime] = None,
        sentiment_filter: Optional[str] = None,
        search_text: Optional[str] = None,
        page: int = 1,
        per_page: int = 10,
        sort_by: str = 'created_at_desc',
    ) -> Dict[str, object]:
        """
        Execute the use case.
        
        Args:
            authorized_hotel_ids: List of hotel IDs the admin is authorized to view
            rating_filter: Filter by specific rating (1-5) or None
            date_from: Filter reviews from this date onwards
            date_to: Filter reviews until this date
            sentiment_filter: Filter by sentiment ('positive', 'neutral', 'negative')
            search_text: Free-text search in comment text
            page: Pagination page (1-based)
            per_page: Items per page (1-100, default 10)
            sort_by: Sort column and direction (created_at_desc, created_at_asc, rating_desc, rating_asc)
        
        Returns:
            Dictionary with:
            - reviews: List of AdminReview objects
            - total: Total matching reviews
            - page: Current page
            - per_page: Items per page
            - total_pages: Total number of pages
            - kpis: KPI metrics for the filtered dataset
        """
        # Validation
        if not authorized_hotel_ids:
            raise ValueError('At least one authorized hotel ID is required')
        
        if page < 1:
            raise ValueError('page debe ser mayor o igual a 1')
        
        if per_page < 1 or per_page > 100:
            raise ValueError('per_page debe estar entre 1 y 100')
        
        if rating_filter is not None and (rating_filter < 1 or rating_filter > 5):
            raise ValueError('rating_filter debe estar entre 1 y 5')
        
        if sentiment_filter and sentiment_filter not in ['positive', 'neutral', 'negative']:
            raise ValueError("sentiment_filter debe ser 'positive', 'neutral', o 'negative'")
        
        if sort_by not in ['created_at_desc', 'created_at_asc', 'rating_desc', 'rating_asc']:
            raise ValueError("sort_by debe ser una de: created_at_desc, created_at_asc, rating_desc, rating_asc")
        
        # Query reviews and KPIs with same filters
        reviews, total = self.repository.find_admin_reviews_with_filters(
            authorized_hotel_ids=authorized_hotel_ids,
            rating_filter=rating_filter,
            date_from=date_from,
            date_to=date_to,
            sentiment_filter=sentiment_filter,
            search_text=search_text,
            page=page,
            per_page=per_page,
            sort_by=sort_by,
        )
        
        kpis = self.repository.get_admin_reviews_kpis(
            authorized_hotel_ids=authorized_hotel_ids,
            rating_filter=rating_filter,
            date_from=date_from,
            date_to=date_to,
            sentiment_filter=sentiment_filter,
            search_text=search_text,
        )
        
        total_pages = (total + per_page - 1) // per_page  # Ceiling division
        
        return {
            'reviews': [review.to_dict() for review in reviews],
            'total': total,
            'page': page,
            'per_page': per_page,
            'total_pages': total_pages,
            'kpis': kpis,
        }
