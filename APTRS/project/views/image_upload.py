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
import boto3
from botocore.exceptions import NoCredentialsError, PartialCredentialsError

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
    permission_classes = [IsAuthenticated, IsAdminUser]
    def get(self, request):
        filename = request.GET.get('filename')
        if not filename:
            return Response({"error": "Filename parameter is required"}, status=400)

        if settings.USE_S3:
            try:
                s3_client = boto3.client(
                    's3',
                    aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
                    aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
                    region_name=settings.AWS_S3_REGION_NAME,
                    endpoint_url=settings.AWS_S3_ENDPOINT_URL
                )
                file_path = os.path.join('poc', filename)
                s3_object = s3_client.get_object(Bucket=settings.AWS_STORAGE_BUCKET_NAME, Key=file_path)
                content_type = s3_object['ContentType']
                image_data = s3_object['Body'].read()

                return HttpResponse(image_data, content_type=content_type)

            except s3_client.exceptions.NoSuchKey:
                raise Http404("Image not found in S3")
            except (NoCredentialsError, PartialCredentialsError) as e:
                logger.error(str(e))
                return Response({"error": "Something Went Wrong"}, status=500)
            except Exception as e:
                logger.error(str(e))
                return Response({"error": "Something Went Wrong"}, status=500)

        else:
            file_path = os.path.join(settings.CKEDITOR_UPLOAD_LOCATION, filename)
            if default_storage.exists(file_path):
                image_file = default_storage.open(file_path)
                content_type = self._get_content_type(filename)
                return HttpResponse(image_file.read(), content_type=content_type)
            else:
                raise Http404("Image not found")

    def _get_content_type(self, filename):
        ext = os.path.splitext(filename)[-1].lower()
        content_types = {
            '.jpg': 'image/jpeg',
            '.jpeg': 'image/jpeg',
            '.png': 'image/png',
        }
        return content_types.get(ext, 'application/octet-stream')
