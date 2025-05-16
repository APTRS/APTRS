import logging
import os
from django.conf import settings
from rest_framework.decorators import (api_view, permission_classes)
from rest_framework.parsers import MultiPartParser
from rest_framework.permissions import IsAuthenticated,IsAdminUser
from rest_framework.response import Response
from rest_framework.views import APIView
from utils.permissions import custom_permission_required
from ..serializers import (ImageSerializer)
from django.core.files.storage import default_storage
import uuid
from django.http import HttpResponse, Http404
from utils.image_handler import get_image_data
from utils.token import verify_image_access_token

logger = logging.getLogger(__name__)

@api_view(['DELETE'])
@permission_classes([IsAuthenticated,IsAdminUser])
def delete_images(request):

    image_paths = request.data
    deleted_images = []
    failed_images = []
    for path in image_paths:
        path = os.path.basename(path)
        fullimage_path =  os.path.normpat(os.path.join(settings.CKEDITOR_UPLOAD_LOCATION, path))
        if fullimage_path.startswith(settings.CKEDITOR_UPLOAD_LOCATION):
            try:
                os.remove(fullimage_path)
                deleted_images.append(image_paths)
            except FileNotFoundError:
                failed_images.append(image_paths)
        else:
            return Response({'message': 'Error, Invalid Image path provided'})
    response_data = {
        'deleted_images': deleted_images,
        'failed_images': failed_images
    }
    return Response(response_data)

class ImageUploadView(APIView):
    permission_classes = [IsAuthenticated, IsAdminUser]
    parser_classes = [MultiPartParser]

    @custom_permission_required(['Manage Projects'])
    def post(self, request):
        serializer = ImageSerializer(data=request.data)
        if serializer.is_valid():
            image = serializer.validated_data['upload']
            unique_filename = f"{uuid.uuid4()}{os.path.splitext(image.name)[1]}"
            upload_path = os.path.join('poc', unique_filename)
            default_storage.save(upload_path, image)
            response_data = {"url": f"project/getimage/?filename={unique_filename}"}
            return Response(response_data)
        else:
            return Response(serializer.errors, status=400)








class GetImageView(APIView):
    """
    View to handle image retrieval for Ckeditor which includes = (Project Exception, Description) & Vulnerability Description, POC, Solution, Reference Link section.
    Most of the Images contain sensitive information, so only admin or internal user are allowed to access them.
    Image are required during report
        - Customer can request to generate report for the project but they are not allowed to access the image.

        - Report API generate a new customer with allow_image_access True, 
        - The token is used by report generation function to access images.
        - The token is never shared with customer.  
        - The Auth token does not have allow_image_access set, means customer cannot directly call the image API.
        - Before generating the report, Customer Validation is in place, hence generated token will only be used to access the image of the Customer Projects only.

    """
    permission_classes = [IsAuthenticated]
    def get(self, request):
        filename = request.GET.get('filename')
        if not request.user.is_staff:
            # Extract token from Authorization header (Bearer token)
            auth_header = request.META.get('HTTP_AUTHORIZATION', '')
            if auth_header.startswith('Bearer '):
                token = auth_header.split(' ')[1]
            else:
                # Try to get token from cookie
                token = request.COOKIES.get('access_token')
                
            # Verify the token
            allow_access = verify_image_access_token(token)
            if not allow_access:
                return Response({"error": "You do not have permission to access this image."}, status=403)

        if not filename:
            return Response({"error": "Filename parameter is required"}, status=400)

        image_data, content_type, error = get_image_data(filename)
        
        if error:
            if "not found" in error.lower():
                raise Http404(error)
            return Response({"error": error}, status=500)
            
        return HttpResponse(image_data, content_type=content_type)







