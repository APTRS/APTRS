# Django imprts
from django.core.cache import cache
from django.db.models import Count, F, ExpressionWrapper, DurationField
from datetime import timedelta
from django.db.models.functions import TruncMonth
from django.utils import timezone
from datetime import timedelta
import calendar
from django.core.cache import cache

#local imports
from project.models import Project, ProjectRetest, Vulnerability


def getproject_details_core(user_company):

    # Fetch all projects with required related objects in a single query
    # Filter by company and prefetch related owner data
    projects = Project.objects.filter(
        companyname=user_company
    ).select_related(
        'companyname'
    ).prefetch_related(
        'owner'
    ).only(
        'id', 'name', 'startdate', 'enddate', 'status', 'companyname'
    )

    # Fetch all project retests with required related objects in a single query
    # Filter by company and prefetch related owner data and project
    retests = ProjectRetest.objects.filter(
        project__companyname=user_company
    ).select_related(
        'project'
    ).prefetch_related(
        'owner'
    ).only(
        'id', 'startdate', 'enddate', 'is_active', 'is_completed', 'project'
    )

    # Current date for status calculations
    current_date = timezone.now().date()

    # Filter retests by calculated status
    active_retests = []
    delay_retests = []
    upcoming_retests = []
    on_hold_retests = []

    # Collect projects with active retests to exclude them from project lists
    projects_with_active_retests = set()

    for r in retests:
        # Skip completed retests
        if r.is_completed:
            continue

        # For any non-completed retest, track the project ID
        projects_with_active_retests.add(r.project.id)

        # On hold retests
        if not r.is_active:
            on_hold_retests.append(r)
            continue

        # Active but not completed retests - calculate status based on dates
        start_date = r.startdate
        end_date = r.enddate

        if current_date < start_date:
            upcoming_retests.append(r)
        elif current_date <= end_date:
            active_retests.append(r)
        else:
            delay_retests.append(r)

    # Create filtered querysets for different statuses - exclude projects with active retests
    active_projects = [p for p in projects if p.status == 'In Progress' and p.id not in projects_with_active_retests]
    delay_projects = [p for p in projects if p.status == 'Delay' and p.id not in projects_with_active_retests]
    upcoming_projects = [p for p in projects if p.status == 'Upcoming' and p.id not in projects_with_active_retests]
    on_hold_projects = [p for p in projects if p.status == 'On Hold' and p.id not in projects_with_active_retests]

    # Count projects by status - combined counts for projects and retests
    active_count = len(active_projects) + len(active_retests)
    delay_count = len(delay_projects) + len(delay_retests)
    upcoming_count = len(upcoming_projects) + len(upcoming_retests)
    on_hold_count = len(on_hold_projects) + len(on_hold_retests)

    # Prepare detailed project data - keep projects and retests separate
    active_projects_data = []
    for project in active_projects:
        active_projects_data.append({
            'id': project.id,
            'name': project.name,
            'startdate': project.startdate,
            'enddate': project.enddate,
            'status': project.status,
            'owners': [{'username': user.username, 'full_name': user.full_name} for user in project.owner.all()]
        })

    # Prepare retest data separately
    active_retests_data = []
    for retest in active_retests:
        active_retests_data.append({
            'id': retest.id,
            'name': f"{retest.project.name} (Retest)",
            'startdate': retest.startdate,
            'enddate': retest.enddate,
            'status': 'In Progress',  # Calculate status since it's no longer in the model
            'project_id': retest.project.id,
            'owners': [{'username': user.username, 'full_name': user.full_name} for user in retest.owner.all()]
        })

    delay_projects_data = []
    for project in delay_projects:
        delay_projects_data.append({
            'id': project.id,
            'name': project.name,
            'startdate': project.startdate,
            'enddate': project.enddate,
            'status': project.status,
            'owners': [{'username': user.username, 'full_name': user.full_name} for user in project.owner.all()]
        })

    # Prepare delay retest data separately
    delay_retests_data = []
    for retest in delay_retests:
        delay_retests_data.append({
            'id': retest.id,
            'name': f"{retest.project.name} (Retest)",
            'startdate': retest.startdate,
            'enddate': retest.enddate,
            'status': 'Delay',  # Calculate status since it's no longer in the model
            'project_id': retest.project.id,
            'owners': [{'username': user.username, 'full_name': user.full_name} for user in retest.owner.all()]
        })

    upcoming_projects_data = []
    for project in upcoming_projects:
        upcoming_projects_data.append({
            'id': project.id,
            'name': project.name,
            'startdate': project.startdate,
            'enddate': project.enddate,
            'status': project.status,
            'owners': [{'username': user.username, 'full_name': user.full_name} for user in project.owner.all()]
        })

    # Prepare upcoming retest data separately
    upcoming_retests_data = []
    for retest in upcoming_retests:
        upcoming_retests_data.append({
            'id': retest.id,
            'name': f"{retest.project.name} (Retest)",
            'startdate': retest.startdate,
            'enddate': retest.enddate,
            'status': 'Upcoming',  # Calculate status since it's no longer in the model
            'project_id': retest.project.id,
            'owners': [{'username': user.username, 'full_name': user.full_name} for user in retest.owner.all()]
        })

    # Prepare on hold project data
    on_hold_projects_data = []
    for project in on_hold_projects:
        on_hold_projects_data.append({
            'id': project.id,
            'name': project.name,
            'startdate': project.startdate,
            'enddate': project.enddate,
            'status': project.status,
            'owners': [{'username': user.username, 'full_name': user.full_name} for user in project.owner.all()]
        })

    # Prepare on hold retest data separately
    on_hold_retests_data = []
    for retest in on_hold_retests:
        on_hold_retests_data.append({
            'id': retest.id,
            'name': f"{retest.project.name} (Retest)",
            'startdate': retest.startdate,
            'enddate': retest.enddate,
            'status': 'On Hold',  # Calculate status since it's no longer in the model
            'project_id': retest.project.id,
            'owners': [{'username': user.username, 'full_name': user.full_name} for user in retest.owner.all()]
        })

    # Restructured response with combined counts but separate project and retest details
    response_data = {
        'counts': {
            'active_count': active_count,
            'delay_count': delay_count,
            'upcoming_count': upcoming_count,
            'on_hold_count': on_hold_count,
            'total_count': active_count + delay_count + upcoming_count + on_hold_count
        },
        'active': {
            'projects': active_projects_data,
            'retests': active_retests_data
        },
        'delay': {
            'projects': delay_projects_data,
            'retests': delay_retests_data
        },
        'upcoming': {
            'projects': upcoming_projects_data,
            'retests': upcoming_retests_data
        },
        'on_hold': {
            'projects': on_hold_projects_data,
            'retests': on_hold_retests_data
        }
    }

    return response_data





def getVulnerabilityDashboardStats_core(user_company):
    """
    Combined API endpoint that returns two sets of data:
    1. Vulnerability counts by severity for vulnerable, published vulnerabilities
    2. Monthly trends of Critical/High/Medium vulnerabilities for the past 5 months
    """


    cache_key = f'vulnerability_dashboard_stats_{user_company.id}'
    cached_data = cache.get(cache_key)

    if cached_data:
        return cached_data

    # Calculate date range for the last 5 months using timezone-aware datetime objects
    current_date = timezone.now()
    # Get first day of current month with the same timezone
    first_of_month = current_date.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    # Calculate first day of 5 months ago
    five_months_ago = first_of_month
    for _ in range(4):  # Go back 4 months from the current month
        # First get previous month by subtracting one day from first of month
        last_day_prev_month = five_months_ago - timedelta(days=1)
        # Then get first day of that previous month
        five_months_ago = last_day_prev_month.replace(day=1)

    # Part 1: Directly get counts per severity in a single query
    severity_counts = dict(
        Vulnerability.objects.filter(
            project__companyname=user_company,
            status='Vulnerable',
            published=True
        )
        .values('vulnerabilityseverity')
        .annotate(count=Count('id'))
        .values_list('vulnerabilityseverity', 'count')
    )

    # Format the counts with proper keys
    counts_by_severity = {
        'Critical': severity_counts.get('Critical', 0),
        'High': severity_counts.get('High', 0),
        'Medium': severity_counts.get('Medium', 0),
        'Low': severity_counts.get('Low', 0),
        'None': severity_counts.get('None', 0) + severity_counts.get('Info', 0),
        'total': sum(severity_counts.values())
    }

    # Part 2: Monthly trends - use a more efficient query with database-level aggregation
    # Generate a list of the last 5 months for reference
    months = []
    month_date = five_months_ago
    while len(months) < 5:
        months.append({
            'date': month_date,
            'key': month_date.strftime('%Y-%m'),
            'name': calendar.month_name[month_date.month],
            'year': month_date.year
        })
        # Move to next month
        if month_date.month == 12:
            month_date = month_date.replace(year=month_date.year + 1, month=1)
        else:
            month_date = month_date.replace(month=month_date.month + 1)

    # Query for trends with optimized database aggregation
    trends = (
        Vulnerability.objects.filter(
            project__companyname=user_company,
            published=True,
            # Use timezone-aware datetime for filtering
            published_date__gte=five_months_ago,
            vulnerabilityseverity__in=['Critical', 'High', 'Medium']
        )
        .annotate(
            month=TruncMonth('published_date'),
            month_key=TruncMonth('published_date')
        )
        .values('month_key', 'vulnerabilityseverity')
        .annotate(count=Count('id'))
    )

    # Create a more efficient dictionary for lookups
    trend_data = {}
    for item in trends:
        month_key = item['month_key'].strftime('%Y-%m')
        severity = item['vulnerabilityseverity']
        count = item['count']

        if month_key not in trend_data:
            trend_data[month_key] = {'Critical': 0, 'High': 0, 'Medium': 0}

        trend_data[month_key][severity] = count

    # Format the monthly trends response using the pre-generated months list
    monthly_trends = []
    for month in months:
        month_key = month['key']
        monthly_trends.append({
            'month': month_key,
            'month_name': month['name'],
            'year': month['year'],
            'Critical': trend_data.get(month_key, {}).get('Critical', 0),
            'High': trend_data.get(month_key, {}).get('High', 0),
            'Medium': trend_data.get(month_key, {}).get('Medium', 0)
        })

    response_data = {
        'severity_counts': counts_by_severity,
        'monthly_trends': monthly_trends
    }

    cache.set(cache_key, response_data, 60 * 60)
    return response_data



def getOrganizationVulnerabilityStats_core(user_company):
    """
    API endpoint that returns organization security metrics:
    1. Security Score: (1 - (High * 0.6 + Medium * 0.3 + Low * 0.1) / Total) * 100
    2. Remediated Issues: Count of fixed vulnerabilities and percentage
    3. Average Time to Fix: For fixed vulnerabilities
    """

    cache_key = f'organization_vulnerability_stats_{user_company.id}'
    cached_data = cache.get(cache_key)

    if cached_data:
        return cached_data  # Return cached data as a dictionary

    # Get current date for reference
    current_date = timezone.now()

    # Calculate date for last quarter (3 months ago)
    three_months_ago = current_date - timedelta(days=90)

    # Get all published vulnerabilities for the company
    all_vulnerabilities = Vulnerability.objects.filter(
        project__companyname=user_company,
        published=True
    )

    # Get counts for open (Vulnerable status) vulnerabilities by severity
    open_vulnerabilities = all_vulnerabilities.filter(
        status='Vulnerable'
    ).values('vulnerabilityseverity').annotate(
        count=Count('id')
    )

    # Create dictionary for severity counts
    severity_counts = {
        'Critical': 0,
        'High': 0,
        'Medium': 0,
        'Low': 0,
        'None': 0,
        'Info': 0,
        'total': 0
    }

    # Fill in actual counts
    for vuln in open_vulnerabilities:
        severity = vuln['vulnerabilityseverity']
        count = vuln['count']
        severity_counts[severity] = count
        severity_counts['total'] += count

    # Calculate security score
    total_vulns = severity_counts['total']
    if total_vulns > 0:
        # Formula: (1 - (High * 0.6 + Medium * 0.3 + Low * 0.1) / Total) * 100
        weighted_score = (
            severity_counts['High'] * 0.6 +
            severity_counts['Medium'] * 0.3 +
            severity_counts['Low'] * 0.1 +
            severity_counts['Critical'] * 0.9  # Adding Critical with higher weight
        )
        security_score = max(0, min(100, (1 - (weighted_score / total_vulns)) * 100))
    else:
        security_score = 100  # Perfect score if no vulnerabilities

    # Calculate score change from previous quarter
    previous_quarter_vulns = all_vulnerabilities.filter(
        published_date__lt=three_months_ago
    )

    # Get previous quarter counts
    previous_severity_counts = {
        'Critical': 0,
        'High': 0,
        'Medium': 0,
        'Low': 0,
        'None': 0,
        'Info': 0,
        'total': 0
    }

    prev_open_vulns = previous_quarter_vulns.filter(status='Vulnerable')
    for severity in ['Critical', 'High', 'Medium', 'Low', 'None', 'Info']:
        count = prev_open_vulns.filter(vulnerabilityseverity=severity).count()
        previous_severity_counts[severity] = count
        previous_severity_counts['total'] += count

    # Calculate previous quarter score
    prev_total = previous_severity_counts['total']
    if prev_total > 0:
        prev_weighted_score = (
            previous_severity_counts['High'] * 0.6 +
            previous_severity_counts['Medium'] * 0.3 +
            previous_severity_counts['Low'] * 0.1 +
            previous_severity_counts['Critical'] * 0.9
        )
        previous_score = max(0, min(100, (1 - (prev_weighted_score / prev_total)) * 100))
        score_change = security_score - previous_score
    else:
        previous_score = 100
        score_change = 0

    # Get remediated issues (fixed vulnerabilities)
    remediated_vulns = all_vulnerabilities.filter(
        status='Confirm Fixed'
    ).count()

    # Calculate percentage of fixed vulnerabilities
    total_actionable_vulns = all_vulnerabilities.exclude(status='Accepted Risk').count()
    if total_actionable_vulns > 0:
        remediation_percentage = (remediated_vulns / total_actionable_vulns) * 100
    else:
        remediation_percentage = 100  # All fixed if none are actionable

    # Calculate average time to fix for vulnerabilities that have been fixed
    # Using the new fixed_date field for accurate calculations
    fixed_vulns = all_vulnerabilities.filter(
        status='Confirm Fixed',
        published_date__isnull=False,
        fixed_date__isnull=False
    ).annotate(
        fix_time=ExpressionWrapper(
            F('fixed_date') - F('published_date'),
            output_field=DurationField()
        )
    )

    avg_days_to_fix = None
    if fixed_vulns.exists():
        # Calculate average days to fix
        total_days = 0
        count = 0
        for vuln in fixed_vulns:
            if vuln.fix_time:
                days = vuln.fix_time.days
                if days >= 0:  # Ensure we only count positive durations
                    total_days += days
                    count += 1

        if count > 0:
            avg_days_to_fix = total_days / count

    # Compile response data
    response_data = {
        'security_score': {
            'current': round(security_score, 1),
            'change': round(score_change, 1),
            'change_text': f"{'+' if score_change > 0 else ''}{round(score_change, 1)} from last quarter"
        },
        'remediated_issues': {
            'count': remediated_vulns,
            'percentage': round(remediation_percentage, 1),
            'text': f"{remediated_vulns} ({round(remediation_percentage)}% of total)"
        },
        'avg_fix_time': {
            'days': round(avg_days_to_fix) if avg_days_to_fix else None,
            'text': f"{round(avg_days_to_fix) if avg_days_to_fix else 'N/A'} days",
            'critical_days': None  # Will be populated if critical vulnerabilities exist
        }
    }

    # Calculate average time to fix for critical vulnerabilities
    critical_fixed_vulns = fixed_vulns.filter(vulnerabilityseverity='Critical')
    if critical_fixed_vulns.exists():
        critical_total_days = 0
        critical_count = 0
        for vuln in critical_fixed_vulns:
            if vuln.fix_time:
                days = vuln.fix_time.days
                if days >= 0:  # Ensure we only count positive durations
                    critical_total_days += days
                    critical_count += 1

        if critical_count > 0:
            avg_critical_days = critical_total_days / critical_count
            response_data['avg_fix_time']['critical_days'] = round(avg_critical_days)
            response_data['avg_fix_time']['text'] += f", Critical issues: {round(avg_critical_days)} days"

    # Cache the response for 1 hour
    cache.set(cache_key, response_data, 60 * 60)

    return response_data  # Return as a dictionary


def fetch_last_ten_vulnerabilities(user_company):
    """
    Fetch the last 10 published vulnerabilities for the user's company
    Including project ID for each vulnerability
    """
    vulnerabilities = (
        Vulnerability.objects.filter(
            project__companyname=user_company,
            published=True
        ).select_related(
            'project'
        ).only(
            'id', 'vulnerabilityname', 'vulnerabilityseverity',
            'published_date', 'project__name', 'project__id'
        ).order_by('-published_date')[:10]
    )
    return vulnerabilities
