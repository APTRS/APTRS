from django_filters import rest_framework as filters
from accounts.models import CustomUser
from rest_framework.pagination import LimitOffsetPagination


class UserFilter(filters.FilterSet):
    class Meta:
        model = CustomUser
        fields = ('username', 'full_name','email','is_active')




def paginate_queryset(queryset, request):
    paginator = LimitOffsetPagination()
    paginator.default_limit = 20  
    paginator.max_limit = 50
    paginated_queryset = paginator.paginate_queryset(queryset, request)
    return paginator, paginated_queryset