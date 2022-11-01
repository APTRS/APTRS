
# Prerequisites

* **Linux**:
  * Install Git `sudo apt-get install git`
  * Install Python 3.8+ `sudo apt-get install python3.8`
  * Install the following dependencies
    ```bash
    sudo apt install python3-dev python3-venv python3-pip build-essential wkhtmltopdf
    ```
  * If you get error while genetrating PDF report uninstall the `wkhtmltopdf` with `sudo apt remove -y wkhtmltopdf` and install it again manually using debian file or according to your system [Dowload for here](https://wkhtmltopdf.org/downloads.html).
  * If you are using kali linux 64 bit install this `wkhtmltopdf`  https://github.com/wkhtmltopdf/packaging/releases/download/0.12.6.1-2/wkhtmltox_0.12.6.1-2.bullseye_amd64.deb
  * APTRS requires `wkhtmltopdf` version 0.12.6

* **Windows**
  * Install [Git](https://git-scm.com/download/win)
  * Install [Python **3.8+**](https://www.python.org/)
  * Download & Install [wkhtmltopdf](https://wkhtmltopdf.org/downloads.html) as per the [wiki instructions](https://github.com/JazzCore/python-pdfkit/wiki/Installing-wkhtmltopdf)
  * Add the folder that contains `wkhtmltopdf` binary to environment variable PATH.


?> **IMPORTANT:** Set `wkhtmltopdf` environment variable. APTRS requires `wkhtmltopdf 0.12.6` and above.

***
