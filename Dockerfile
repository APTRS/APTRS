# Base image
FROM ubuntu:20.04

# Labels and Credits
LABEL \
    name="AAPTRS" \
    author="Sourav Kalal <kalalsourav20@gmail.com>" \
    maintainer="Sourav Kalal <kalalsourav20@gmail.com>" \
    description="APTRS (Automated Penetration Testing Reporting System) is an automated reporting tool in Python and Django. The tool allows Penetration testers to create a report directly without using the Traditional Docx file. It also provides an approach to keeping track of the projects and vulnerabilities."

# Environment vars
ENV DEBIAN_FRONTEND="noninteractive" \
    WKH_FILE="wkhtmltox_0.12.6-1.focal_amd64.deb" \
    WKH_FILE_ARM="wkhtmltox_0.12.6-1.focal_arm64.deb" 


RUN apt update -y && apt install -y  --no-install-recommends \
    build-essential \
    locales \
    sqlite3 \
    fontconfig-config \
    libjpeg-turbo8 \
    libxrender1 \
    libfontconfig1 \
    libxext6 \
    fontconfig \
    xfonts-75dpi \
    xfonts-base \
    python3.9 \
    python3-dev \
    python3-pip \
    wget \
    curl \
    git 

ARG TARGETPLATFORM




RUN groupadd -g 9901 aptrs
RUN adduser aptrs --shell /bin/false -u 9901 --ingroup aptrs --gecos "" --disabled-password


COPY requirements.txt .
RUN pip3 install --upgrade --no-cache-dir setuptools pip && \
    pip3 install --quiet --no-cache-dir -r requirements.txt

# Cleanup
RUN \
    apt remove -y \
        libssl-dev \
        libffi-dev \
        libxml2-dev \
        libxslt1-dev \
        python3-dev \
        wget && \
    apt clean && \
    apt autoclean && \
    apt autoremove -y && \
    rm -rf /var/lib/apt/lists/* /tmp/* > /dev/null 2>&1
    
COPY scripts/wkhtmltopdf.sh .
RUN chmod +x ./wkhtmltopdf.sh
RUN ./wkhtmltopdf.sh


WORKDIR /home/APTRS/APTRS
# Copy source code
COPY . .
RUN python3 /home/APTRS/APTRS/APTRS/manage.py collectstatic --no-input

EXPOSE 8000 8000 



RUN chown -R aptrs:aptrs /home/APTRS/APTRS

USER aptrs

RUN ["chmod", "+x", "/home/APTRS/APTRS/scripts/entrypoint.sh"]

CMD ["/home/APTRS/APTRS/scripts/entrypoint.sh"]
