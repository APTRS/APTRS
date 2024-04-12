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
    startdate = filters.CharFilter(method='filter_date')
    enddate = filters.CharFilter(method='filter_date')
    name = filters.CharFilter(field_name='name', lookup_expr='icontains')
    companyname = filters.CharFilter(field_name='companyname__name', lookup_expr='icontains')
    projecttype = filters.CharFilter(field_name='projecttype', lookup_expr='icontains')
    #owner = filters.CharFilter(field_name='owner', lookup_expr='icontains')
    owner = filters.CharFilter(field_name='owner__username', lookup_expr='icontains')
    status = filters.CharFilter(field_name='status', lookup_expr='icontains')

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
