import logging
import os
from django.conf import settings
from django.core.files.storage import default_storage
import boto3
from botocore.exceptions import NoCredentialsError, PartialCredentialsError
import base64
import re
from typing import Tuple, Optional


logger = logging.getLogger(__name__)

def get_content_type(filename):
    """
    Determine the content type based on file extension

    Args:
        filename: Name of the file

    Returns:
        The content type as a string
    """
    ext = os.path.splitext(filename)[-1].lower()
    content_types = {
        '.jpg': 'image/jpeg',
        '.jpeg': 'image/jpeg',
        '.png': 'image/png',
    }
    return content_types.get(ext, 'application/octet-stream')


def get_image_data(filename) -> Tuple[Optional[bytes], Optional[str], Optional[str]]:
    """
    Retrieve image data from either S3 or local storage

    Args:
        filename: The name of the image file

    Returns:
        Tuple containing (image_data, content_type, error_message)
        - image_data: Binary data of the image if successful, None otherwise
        - content_type: Content type of the image if successful, None otherwise
        - error_message: Error message if an error occurred, None otherwise
    """
    if not filename:
        return None, None, "Filename parameter is required"

    try:
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

                return image_data, content_type, None

            except s3_client.exceptions.NoSuchKey:
                return None, None, "Image not found in S3"
            except (NoCredentialsError, PartialCredentialsError) as e:
                logger.error(f"S3 credential error: {str(e)}")
                return None, None, "Authentication error with storage service"
            except Exception as e:
                logger.error(f"Error retrieving image from S3: {str(e)}")
                return None, None, "Something went wrong while retrieving image"

        else:
            file_path = os.path.join(settings.CKEDITOR_UPLOAD_LOCATION, filename)
            if default_storage.exists(file_path):
                with default_storage.open(file_path, 'rb') as f:
                    image_data = f.read()
                content_type = get_content_type(filename)
                return image_data, content_type, None
            else:
                return None, None, "Image not found in local storage"

    except Exception as e:
        logger.error(f"Unexpected error retrieving image {filename}: {str(e)}")
        return None, None, f"Unexpected error: {str(e)}"

def embed_images_in_html(html_content):
    """
    Replace image URLs in HTML content with base64-encoded images

    Args:
        html_content: HTML string that may contain image references

    Returns:
        HTML string with embedded base64 images
    """
    print("Embedding images in HTML content")
    print(html_content)
    if not html_content:
        return html_content

    patterns = [
        r'<img[^>]*src=["\']/api/project/getimage/\?filename=([^"\'&]+)["\'][^>]*>'  # New format
    ]

    def replace_with_base64(match):
        img_tag = match.group(0)
        filename = match.group(1)

        image_data, content_type, error = get_image_data(filename)

        if error or not image_data:
            logger.error(f"Error embedding image {filename}: {error}")
            return img_tag

        try:
            base64_data = base64.b64encode(image_data).decode('utf-8')

            new_img_tag = re.sub(
                r'src=["\'][^"\']*getimage/\?filename=[^"\'&]+["\']',
                f'src="data:{content_type};base64,{base64_data}"',
                img_tag
            )

            return new_img_tag
        except Exception as e:
            logger.error(f"Error encoding image {filename}: {str(e)}")
            return img_tag

    result = html_content
    for pattern in patterns:
        result = re.sub(pattern, replace_with_base64, result)

    return result