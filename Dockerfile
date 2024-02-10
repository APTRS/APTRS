# Base image
FROM ubuntu:20.04

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
    python3.9 \
    python3-dev \
    python3-pip \
    wget \
    curl \
    git \
    nginx \
    python3-cffi \
    python3-brotli \
    libpango-1.0-0 \
    libharfbuzz0b \
    libpangoft2-1.0-0


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


WORKDIR /home/aptrs
# Copy source code
COPY . .

ARG POSTGRES=False
ENV POSTGRES_USER=aptrsdbuser \
    POSTGRES_PASSWORD=aptrsdbpassword \
    POSTGRES_DB=aptrs \
    POSTGRES_HOST=postgres


RUN if [ "$POSTGRES" = "True" ]; then \
    pip3 install psycopg2-binary && \
    sed -i '/# Sqlite3 support/,/# End Sqlite3 support/d' /home/aptrs/APTRS/APTRS/settings.py && \
    sed -i '/# Postgres DB - Install psycopg2/,/"""/d' /home/aptrs/APTRS/APTRS/settings.py && \
    sed -i '/# End Postgres support/,/"""/d' /home/aptrs/APTRS/APTRS/settings.py; \
  fi


#RUN python3 /home/aptrs/APTRS/manage.py collectstatic --no-input

RUN NEW_SECRET_KEY=$(python3 -c "import random, string; print(''.join(random.choices(string.ascii_letters + string.digits + string.punctuation, k=50)))")
RUN sed -i "s/^SECRET_KEY=.*/SECRET_KEY='$NEW_SECRET_KEY'/" /home/aptrs/APTRS/.env

EXPOSE 8000 8000 



RUN chown -R aptrs:aptrs /home/aptrs/

USER aptrs

RUN ["chmod", "+x", "/home/aptrs/scripts/entrypoint.sh"]

CMD ["/home/aptrs/scripts/entrypoint.sh"]
