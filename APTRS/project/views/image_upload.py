import logging
import os
import re
from django.conf import settings
from rest_framework.decorators import (api_view, permission_classes)
from rest_framework.parsers import MultiPartParser
from rest_framework.permissions import IsAuthenticated,IsAdminUser
from rest_framework.response import Response
from rest_framework.views import APIView
from utils.permissions import custom_permission_required
from ..serializers import (ImageSerializer)
from django.core.files.storage import default_storage

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
            filename = sanitize_filename(image.name)
            file_path = os.path.join(settings.CKEDITOR_UPLOAD_LOCATION, filename)
            file = default_storage.save(file_path, image)
            file_url = default_storage.url(file)
            full_url = request.build_absolute_uri(file_url)
            
            response_data = {"url": full_url}
            return Response(response_data)
        else:
            return Response(serializer.errors, status=400)



def sanitize_filename(filename):
    return re.sub(r'[^\w\s-]', '', filename).strip().replace(' ', '_')