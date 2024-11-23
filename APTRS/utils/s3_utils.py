import boto3
from django.conf import settings

def generate_presigned_url(object_key, expiration=3600, response_content_type=None):
    s3_client = boto3.client(
        's3',
        aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
        aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
        region_name=settings.AWS_S3_REGION_NAME,
        endpoint_url=settings.AWS_S3_ENDPOINT_URL
    )

    params = {
        'Bucket': settings.AWS_STORAGE_BUCKET_NAME,
        'Key': object_key,
    }

    if response_content_type:
        params['ResponseContentType'] = response_content_type

    url = s3_client.generate_presigned_url(
        ClientMethod='get_object',
        Params=params,
        ExpiresIn=expiration
    )

    return url

