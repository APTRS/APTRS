import logging

import bleach
from django.core.exceptions import ObjectDoesNotExist
from rest_framework.decorators import (api_view,
                                       permission_classes)
from rest_framework.permissions import IsAuthenticated, IsAdminUser
from rest_framework.response import Response
from rest_framework import status
from utils.permissions import custom_permission_required

from ..models import (ProjectRetest)
from ..serializers import (Retestserializers)

logger = logging.getLogger(__name__)

@api_view(['DELETE'])
@permission_classes([IsAuthenticated,IsAdminUser])
@custom_permission_required(['Manage Projects'])
def Retestdelete(request,pk):
    try:
        retest = ProjectRetest.objects.get(pk=pk)
    except ObjectDoesNotExist:
        logger.error("Retest not found for id=%s", pk)
        return Response({"message": "Retest not found"}, status=status.HTTP_404_NOT_FOUND)
    retest.delete()
    respdata={'Status':"Success"}
    return Response(respdata)




@api_view(['GET'])
@permission_classes([IsAuthenticated,IsAdminUser])
def RetestList(request,pk):
    retest = ProjectRetest.objects.filter(project=pk)

    if not retest:
        logger.error("Retest not found for id=%s", pk)
        return Response({"message": "Retest not found"}, status=status.HTTP_404_NOT_FOUND)

    else:
        serializer = Retestserializers(retest,many=True)
        return Response(serializer.data)



@api_view(['POST'])
@permission_classes([IsAuthenticated,IsAdminUser])
@custom_permission_required(['Manage Projects'])
def Retestadd(request):
    serializer_context = {'request': request}
    serializer = Retestserializers(data=request.data,many=False,context=serializer_context)

    if serializer.is_valid(raise_exception=True):
        serializer.save()
        logger.info("Project retest added by %s for Project id=%s", request.user, request.data.get('project'))
        return Response(serializer.data)
    else:
        logger.error("Something went wrong %s", serializer.errors)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)



@api_view(['GET'])
@permission_classes([IsAuthenticated,IsAdminUser])
@custom_permission_required(['Manage Projects'])
def complete_retest_status(request, pk):
    safe_pk = bleach.clean(pk)
    try:
        projectretest = ProjectRetest.objects.get(pk=safe_pk)
    except ObjectDoesNotExist:
        logger.error("Retest not found for id=%s", safe_pk)
        return Response({"message": "Retest not found"}, status=status.HTTP_404_NOT_FOUND)

    # Set the retest status to 'Completed'
    projectretest.status = 'Completed'
    projectretest.save()

    return Response({'message': f'Status of Retest {safe_pk} updated to Completed'})
