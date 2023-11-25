#!/bin/bash
if [ "$TARGETPLATFORM" == "linux/arm64" ]
then
    WKH_FILE=$WKH_FILE_ARM
    apt install -y git

fi

echo "Target platform identified as $TARGETPLATFORM"

WKH_URL="https://github.com/wkhtmltopdf/packaging/releases/download/0.12.6-1/${WKH_FILE}"

#Download and install wkhtmltopdf
echo "Installing $WKH_FILE ..."
wget --quiet -O /tmp/${WKH_FILE} "${WKH_URL}" && \
    dpkg -i /tmp/${WKH_FILE} && \
    apt-get install -f -y --no-install-recommends && \
    ln -s /usr/local/bin/wkhtmltopdf /usr/bin && \
    rm -f /tmp/${WKH_FILE}

rm $0