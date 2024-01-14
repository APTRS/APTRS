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
    class Meta:
        model = CustomUser
        fields = ('username', 'full_name','email','is_active','position')


class ProjectFilter(filters.FilterSet):
    startdate = filters.CharFilter(method='filter_date')
    enddate = filters.CharFilter(method='filter_date')

    def filter_date(self, queryset, name, value):
        # Convert the start date to a string and perform a case-insensitive contains match
        return queryset.filter(**{f'{name}__contains': value.lower()})

    class Meta:
        model = Project
        fields = ('name','companyname','projecttype','testingtype','owner','status','startdate','enddate')

class VulnerableinstanceFilter(filters.FilterSet):
    URL = filters.CharFilter(field_name='URL', lookup_expr='icontains')
    Parameter = filters.CharFilter(field_name='Parameter', lookup_expr='icontains')
    status = filters.CharFilter(field_name='status', lookup_expr='icontains')

    class Meta:
        model = Vulnerableinstance
        fields = ('URL','Paramter','status')

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
