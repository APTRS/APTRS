
# APTRS
<p align="center">
  <img src="https://repository-images.githubusercontent.com/558932728/e8ff2c72-3797-41ab-9505-90c9008cc472" />
</p>
APTRS (Automated Penetration Testing Reporting System) is an automated reporting tool in Python and Django. The tool allows Penetration testers to create a report directly without using the Traditional Docx file. It also provides an approach to keeping track of the projects and vulnerabilities. 
<br/><br/>

[![GPLv3 License](https://img.shields.io/badge/License-GPL%20v3-yellow.svg)](https://opensource.org/licenses/)
[![sponsors](https://img.shields.io/github/sponsors/Anof-cyber)](https://github.com/sponsors/Anof-cyber)
[![Python Version](https://img.shields.io/badge/Python-3.8-brightgreen)](https://www.python.org/downloads/release/python-3810/)
![GitHub release (latest by date including pre-releases)](https://img.shields.io/github/v/release/Anof-cyber/APTRS?include_prereleases)
![GitHub Workflow Status (with branch)](https://img.shields.io/github/actions/workflow/status/Anof-cyber/APTRS/django.yml?branch=main)
![Libraries.io dependency status for GitHub repo](https://img.shields.io/librariesio/github/Anof-cyber/aptrs)
[![platform](https://img.shields.io/badge/platform-osx%2Flinux%2Fwindows-green.svg)](https://github.com/Anof-cyber/APTRS)
[![Twitter](https://img.shields.io/twitter/follow/ano_f_)](https://twitter.com/Ano_F_)


## Documentation

[Documentation](https://anof-cyber.github.io/APTRS/)


## Prerequisites

- Python 3.8 and above (https://www.python.org/downloads/release/python-3810/)
- wkhtmltopdf 0.12.6 and above (https://wkhtmltopdf.org/downloads.html)


## Installation

The tool has been tested using Python 3.8.10 on Kali Linux 2022.2/3, Ubuntu 20.04.5 LTS, Windows 10/11.

Windows Installation

```Windows
  git clone https://github.com/Anof-cyber/APTRS.git
  cd APTRS
  install.bat
```
    
Linux Installation

```Windows
  git clone https://github.com/Anof-cyber/APTRS.git
  cd APTRS
  install.sh
```
  
## Running

Windows 
```Windows
  run.bat
```


Linux
```bash
  run.sh
```



## Features
- [Demo Report](/Doc/Report/Web%20Application%20Penetration%20Testing%20Report%20of%20Juice%20Shop.pdf)
- Managing Vulnerabilities
- Manage All Projects in one place
- Create a Vulnerability Database and avoid writing the same description and recommendations again
- Easily Create PDF Reprot
- Dynamically add POC, Description and Recommendations
- Manage Customers and Comapany


## Screenshots

### Project
![App Screenshot](/Doc/image/Project.png)


### View Project
![App Screenshot](/Doc/image/View%20Project.png)


### Project Vulnerability
![App Screenshot](/Doc/image/Project%20Vulnerability.png)

### Project Report
![App Screenshot](/Doc/image/Project%20Report.png)


### Project Add Vulnerability
![App Screenshot](/Doc/image/Project%20New%20Vulnerability.png)


## Roadmap

- Improving Report Quality
- Bulk Instance Upload
- [Pentest Mapper](https://portswigger.net/bappstore/af490ae7e79546fa81a28d8d0b90874e) Burp Suite Extension Integration
- Allowing Multiple Project Scope
- Improving Code, Error handling and Security
- Docker Support
- Implementing Rest API
- Project and Project Retest Handler
- Access Control and Authorization
- Support Nessus Parsing


## Authors

- [Sourav Kalal](https://twitter.com/Ano_F_)

## Contributors

A volunteer is required to improve the project and add features to make it more secure and better. We are looking for Django or Front End developers. You can contact kalalsourav20@gmail.com if you are interested. 

<a href = "https://github.com/Anof-cyber/APTRS/graphs/contributors">
  <img src = "https://contrib.rocks/image?repo=Anof-cyber/APTRS"/>
</a>
