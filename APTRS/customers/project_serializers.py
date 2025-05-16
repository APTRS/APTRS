from rest_framework import serializers
from project.models import Project, ProjectRetest
from django.utils import timezone

class ProjectSerializer(serializers.ModelSerializer):
    owner_emails = serializers.SerializerMethodField()
    has_active_retest = serializers.SerializerMethodField()
    retest_owner_emails = serializers.SerializerMethodField()
    retest_startdate = serializers.SerializerMethodField()
    retest_enddate = serializers.SerializerMethodField()
    retest_status = serializers.SerializerMethodField()
    retest_id = serializers.SerializerMethodField()
    
    class Meta:
        model = Project
        fields = ('id', 'name', 'testingtype', 'projecttype', 'startdate', 
                 'enddate', 'status', 'owner_emails', 'hold_reason',
                 'has_active_retest', 'retest_owner_emails', 'retest_startdate', 
                 'retest_enddate', 'retest_status', 'retest_id')
    
    def get_owner_emails(self, obj):
        """Return a list of owner email addresses for the project"""
        return [user.email for user in obj.owner.all()]
        
    def get_has_active_retest(self, obj):
        """Check if the project has any active retests"""
        return ProjectRetest.objects.filter(
            project=obj,
            is_active=True,
            is_completed=False
        ).exists()
        
    def get_retest_owner_emails(self, obj):
        """Return the owner emails for the latest active retest, if any"""
        retest = self._get_latest_active_retest(obj)
        if retest:
            return [user.email for user in retest.owner.all()]
        return []
        
    def get_retest_startdate(self, obj):
        """Return the start date of the latest active retest, if any"""
        retest = self._get_latest_active_retest(obj)
        if retest:
            return retest.startdate
        return None
        
    def get_retest_enddate(self, obj):
        """Return the end date of the latest active retest, if any"""
        retest = self._get_latest_active_retest(obj)
        if retest:
            return retest.enddate
        return None
        
    def get_retest_status(self, obj):
        """Return the calculated status of the latest active retest, if any"""
        retest = self._get_latest_active_retest(obj)
        if retest:
            if retest.is_completed:
                return 'Completed'
            if not retest.is_active:
                return 'On Hold'
                
            # Calculate status based on dates
            current_date = timezone.now().date()
            if current_date < retest.startdate:
                return 'Upcoming'
            elif retest.startdate <= current_date <= retest.enddate:
                return 'In Progress'
            elif current_date > retest.enddate:
                return 'Delay'
            return 'Unknown'
        return None
    
    def get_retest_id(self, obj):
        """Return the ID of the latest active retest, if any"""
        retest = self._get_latest_active_retest(obj)
        if retest:
            return retest.id
        return None
        
    def _get_latest_active_retest(self, obj):
        """Helper method to get the latest active retest for a project"""
        active_retests = ProjectRetest.objects.filter(
            project=obj,
            is_active=True,
            is_completed=False
        ).order_by('-startdate')
        
        if active_retests.exists():
            return active_retests.first()
        return None


class ProjectRetestSerializer(serializers.ModelSerializer):
    owner_emails = serializers.SerializerMethodField()
    status = serializers.SerializerMethodField()
    project_name = serializers.SerializerMethodField()
    project_type = serializers.SerializerMethodField()
    
    class Meta:
        model = ProjectRetest
        fields = ('id', 'startdate', 'enddate', 'status', 
                 'owner_emails', 'project_name', 'project_type')
    
    def get_owner_emails(self, obj):
        """Return a list of owner email addresses for the retest"""
        return [user.email for user in obj.owner.all()]
    
    def get_status(self, obj):
        """Calculate status from is_active and is_completed fields"""
        
        
        if obj.is_completed:
            return 'Completed'
        if not obj.is_active:
            return 'On Hold'
            
        # Calculate status based on dates
        current_date = timezone.now().date()
        if current_date < obj.startdate:
            return 'Upcoming'
        elif obj.startdate <= current_date <= obj.enddate:
            return 'In Progress'
        elif current_date > obj.enddate:
            return 'Delay'
        return 'Unknown'
    
    def get_project_name(self, obj):
        """Return the name of the associated project"""
        return obj.project.name
    
    def get_project_type(self, obj):
        """Return the project type of the associated project"""
        return obj.project.projecttype