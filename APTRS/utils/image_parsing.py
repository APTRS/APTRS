import requests
from io import BytesIO
import re
from django.conf import settings
from urllib.parse import urlparse, parse_qs
import os
from requests.packages.urllib3.exceptions import InsecureRequestWarning

def fetch_image_bytes(image_url_or_path, headers,use_s3=False,base_url="https://nginx/"):
    """Fetch image bytes from a URL (S3) or from the local file system."""

    requests.packages.urllib3.disable_warnings(InsecureRequestWarning)

    image_url = base_url + image_url_or_path
    token_headers = {
                "Authorization": f"Bearer {headers}"
            }
    response = requests.get(image_url,headers=token_headers, verify=False)
    if response.status_code == 200:
        return BytesIO(response.content)
    else:
        raise Exception(f"Failed to retrieve image from {image_url}, status code {response.status_code}")
    '''
    else:
        # If use_s3 is False, fetch from the local file system
        try:
            parsed_url = urlparse(image_url_or_path)
            query_params = parse_qs(parsed_url.query)
        
            # Extract the filename from the query parameter (e.g., filename=<filename_value>)
            filename = query_params.get('filename', [None])[0]
            local_path = os.path.join(settings.BASE_DIR, 'static', 'media', 'poc', filename)
        
            with open(local_path, 'rb') as img_file:
                return BytesIO(img_file.read())
        except Exception as e:
            raise Exception(f"Failed to retrieve image from local file system: {str(e)}")
    '''

def find_images(raw_html, headers,use_s3=False,base_url="https://nginx/"):
    """Find all <img> tags in raw HTML and replace with jinja2 placeholders."""
    regex = r'<img.*?>'
    images = []

    for cnt, match in enumerate(re.finditer(regex, raw_html)):
        image_metadata = {
            'id': cnt,
            'html_tag': match.group()
        }

        # Extract image URL or path from the src attribute
        src_match = re.search(r'src="([^"]+)"', image_metadata['html_tag'])
        if src_match:
            image_url_or_path = src_match.group(1)
            image_metadata['image_url_or_path'] = image_url_or_path
            
            # Fetch image bytes from the URL or local file system
            image_metadata['bytes'] = fetch_image_bytes(image_url_or_path, headers,use_s3,base_url)

        images.append(image_metadata)
    
    return images
