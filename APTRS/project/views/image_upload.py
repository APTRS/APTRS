import logging
import os
from django.conf import settings
from django.core.files.storage import FileSystemStorage
from rest_framework.decorators import (api_view)
from rest_framework.parsers import MultiPartParser
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from utils.permissions import custom_permission_required
from ..serializers import (ImageSerializer)

logger = logging.getLogger(__name__)

@api_view(['DELETE'])
@custom_permission_required(['Delete Images'])
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
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser]

    @custom_permission_required(['Upload Images for Vulnerability'])
    def post(self, request):
        serializer = ImageSerializer(data=request.data)
        if serializer.is_valid():
            images = serializer.validated_data['images']
            paths = []
            for image in images:

                fss = FileSystemStorage(location=settings.CKEDITOR_UPLOAD_LOCATION, base_url=settings.CKEDITOR_UPLOAD_URL)
                file = fss.save(image.name, image)
                file_url = fss.url(file)
                paths.append(file_url)

            return Response({'paths': paths})
        else:
            return Response(serializer.errors, status=400)
