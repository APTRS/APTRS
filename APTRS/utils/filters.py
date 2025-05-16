from rest_framework.pagination import LimitOffsetPagination

from django_filters import rest_framework as filters

from accounts.models import CustomUser
from project.models import Project,Vulnerableinstance
from vulnerability.models import VulnerabilityDB
from customers.models import Company


class CompanyFilter(filters.FilterSet):
    name = filters.CharFilter(field_name='name', lookup_expr='icontains')
    class Meta:
        model = Company
        fields = ('name',)


class UserFilter(filters.FilterSet):
    username = filters.CharFilter(field_name='username', lookup_expr='icontains')
    full_name = filters.CharFilter(field_name='full_name', lookup_expr='icontains')
    email = filters.CharFilter(field_name='email', lookup_expr='icontains')
    position = filters.CharFilter(field_name='position', lookup_expr='icontains')
    class Meta:
        model = CustomUser
        fields = ('username', 'full_name','email','is_active','position')


class ProjectFilter(filters.FilterSet):
    startdate = filters.CharFilter(method='filter_startdate')
    enddate_before = filters.CharFilter(method='filter_enddate')
    name = filters.CharFilter(field_name='name', lookup_expr='icontains')
    companyname = filters.CharFilter(field_name='companyname__name', lookup_expr='icontains')
    projecttype = filters.CharFilter(field_name='projecttype', lookup_expr='icontains')
    #owner = filters.CharFilter(field_name='owner', lookup_expr='icontains')
    owner = filters.CharFilter(field_name='owner__username', lookup_expr='icontains')
    status = filters.CharFilter(field_name='status', lookup_expr='icontains')

    def filter_startdate(self, queryset, name, value):
        # Handle ISO format date string for start date (after or equal)
        try:
            from datetime import datetime
            import logging

            logger = logging.getLogger(__name__)
            logger.info(f"Filtering with startdate: {value}")

            # Parse ISO format (Python 3.7+ compatible)
            if 'Z' in value:
                value = value.replace('Z', '+00:00')
            date_obj = datetime.fromisoformat(value)

            # Filter projects that start on or after this date
            return queryset.filter(startdate__gte=date_obj)
        except Exception as e:
            import logging
            logger = logging.getLogger(__name__)
            logger.error(f"Error filtering by startdate: {str(e)}")
            # Fallback to contains search
            return queryset.filter(startdate__contains=value)

    def filter_enddate(self, queryset, name, value):
        # Handle ISO format date string for end date (before or equal)
        try:
            from datetime import datetime
            import logging

            logger = logging.getLogger(__name__)
            logger.info(f"Filtering with enddate_before: {value}")

            # Parse ISO format (Python 3.7+ compatible)
            if 'Z' in value:
                value = value.replace('Z', '+00:00')
            date_obj = datetime.fromisoformat(value)

            # Filter projects that end on or before this date
            return queryset.filter(enddate__lte=date_obj)
        except Exception as e:
            import logging
            logger = logging.getLogger(__name__)
            logger.error(f"Error filtering by enddate: {str(e)}")
            # Fallback to contains search
            return queryset.filter(enddate__contains=value)

    class Meta:
        model = Project
        fields = ('name','companyname','projecttype','testingtype','owner','status','startdate','enddate')

class VulnerableinstanceFilter(filters.FilterSet):
    URL = filters.CharFilter(field_name='URL', lookup_expr='icontains')
    Parameter = filters.CharFilter(field_name='Parameter', lookup_expr='icontains')
    status = filters.CharFilter(field_name='status', lookup_expr='icontains')

    class Meta:
        model = Vulnerableinstance
        fields = ('URL','Parameter','status')

class VulnerableDBFilter(filters.FilterSet):
    vulnerabilityname = filters.CharFilter(field_name='vulnerabilityname', lookup_expr='icontains')
    vulnerabilityseverity = filters.CharFilter(field_name='vulnerabilityseverity', lookup_expr='icontains')
    cvssscore = filters.NumberFilter(field_name='cvssscore', lookup_expr='exact')

    class Meta:
        model = VulnerabilityDB
        fields = ['vulnerabilityname', 'vulnerabilityseverity', 'cvssscore']



def paginate_queryset(queryset, request):
    paginator = LimitOffsetPagination()
    paginator.default_limit = 20
    paginator.max_limit = 50
    paginated_queryset = paginator.paginate_queryset(queryset, request)
    return paginator, paginated_queryset
