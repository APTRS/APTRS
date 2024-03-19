# Base image
FROM ubuntu:22.04

# Labels and Credits
LABEL \
    name="APTRS" \
    author="Sourav Kalal <kalalsourav20@gmail.com>" \
    maintainer="Sourav Kalal <kalalsourav20@gmail.com>" \
    description="APTRS (Automated Penetration Testing Reporting System) is an automated reporting tool in Python and Django. The tool allows Penetration testers to create a report directly without using the Traditional Docx file. It also provides an approach to keeping track of the projects and vulnerabilities."


ENV TZ=UTC
ENV DEBIAN_FRONTEND=noninteractive
RUN ln -snf /usr/share/zoneinfo/$TZ /etc/localtime && echo $TZ > /etc/timezone

RUN apt update -y && apt install -y  --no-install-recommends \
    build-essential \
    tzdata \
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
    python3 \
    python3-dev \
    python3-pip \
    wget \
    curl \
    git \
    nginx \
    libpango-1.0-0 \
    libharfbuzz0b \
    libpangoft2-1.0-0 \
    postgresql \
    postgresql-contrib \
    libpq-dev



RUN groupadd -g 9901 aptrs
RUN adduser aptrs --shell /bin/false -u 9901 --ingroup aptrs --gecos "" --disabled-password


#COPY requirements.txt .

WORKDIR /home/aptrs
# Copy source code
COPY . .

ENV POSTGRES_USER=aptrsdbuser \
    POSTGRES_PASSWORD=aptrsdbpassword \
    POSTGRES_DB=aptrs \
    POSTGRES_HOST=postgres

ENV YOUR_COMPANY='AnoF PVT LTD'
ENV WHITELIST_IP='["http://127.0.0.1:8080", "https://aptrsapi.souravkalal.tech","http://127.0.0.1:8000","http://testserver"]'
ENV ALLOWED_HOST='["127.0.0.1","localhost","aptrsapi.souravkalal.tech","*"]'
ENV CORS_ORIGIN='["http://127.0.0.1:8080", "https://aptrsapi.souravkalal.tech","http://127.0.0.1:5000"]'
ENV YOUR_COMPANY_LOGO='APTRS.png'


RUN NEW_SECRET_KEY=$(python3 -c "import random, string; print(''.join(random.choices(string.ascii_letters + string.digits + string.punctuation, k=50)))")
ENV SECRET_KEY=NEW_SECRET_KEY
#RUN sed -i "s/^SECRET_KEY=.*/SECRET_KEY='$NEW_SECRET_KEY'/" /home/aptrs/APTRS/.env

RUN python3 -m pip install --upgrade --no-cache-dir pip poetry==1.8.2 && \
    pip install setuptools

    
RUN poetry config virtualenvs.create false
RUN poetry install --no-root --no-interaction --no-ansi
#--no-dev --only main


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


EXPOSE 8000 8000 



RUN chown -R aptrs:aptrs /home/aptrs/

USER aptrs



RUN ["chmod", "+x", "/home/aptrs/scripts/entrypoint.sh"]

CMD ["/home/aptrs/scripts/entrypoint.sh"]
