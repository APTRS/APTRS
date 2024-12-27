

# APTRS
<p align="center">
  <img src="https://repository-images.githubusercontent.com/558932728/6a0fb8ea-a539-4ba6-8ef8-2ee7fb0b3f17" width="500" height="400"/>
</p>
APTRS (Automated Penetration Testing Reporting System) is a Python and Django-based automated reporting tool designed for penetration testers and security organizations. This tool streamlines the report generation process by enabling users to create PDF and Excel reports directly, eliminating the need for manual approaches. Additionally, APTRS offers a systematic way to monitor and manage vulnerabilities within various projects. Keep your penetration testing projects organized and efficient with APTRS.
<br/><br/>

[![sponsors](https://img.shields.io/github/sponsors/Anof-cyber)](https://github.com/sponsors/Anof-cyber)
[![Python Version](https://img.shields.io/badge/Python-3.9+-brightgreen)](https://www.python.org/downloads/release/python-391/)
[![NodeJS Version](https://img.shields.io/badge/NodeJS-18+-brightgreen)](https://nodejs.org/en/download/package-manager)
![GitHub release (latest by date including pre-releases)](https://img.shields.io/github/v/release/APTRS/APTRS?include_prereleases)
![Libraries.io dependency status for GitHub repo](https://img.shields.io/librariesio/github/APTRS/aptrs)
[![platform](https://img.shields.io/badge/platform-osx%2Flinux%2Fwindows-green.svg)](https://github.com/APTRS/APTRS)
[![Django Build](https://github.com/Anof-cyber/APTRS/actions/workflows/django.yml/badge.svg)](https://github.com/Anof-cyber/APTRS/actions/workflows/django.yml)
[![Frontend Test and Build](https://github.com/APTRS/APTRS/actions/workflows/frontend.yml/badge.svg)](https://github.com/APTRS/APTRS/actions/workflows/frontend.yml)
[![Docker Image CI](https://github.com/APTRS/APTRS/actions/workflows/docker.yml/badge.svg)](https://github.com/APTRS/APTRS/actions/workflows/docker.yml)
[![Codacy Badge](https://app.codacy.com/project/badge/Grade/fce97190bae94040823a2994c0722ea8)](https://app.codacy.com/gh/Anof-cyber/APTRS/dashboard?utm_source=gh&utm_medium=referral&utm_content=&utm_campaign=Badge_grade)
[![Security Rating](https://sonarcloud.io/api/project_badges/measure?project=Anof-cyber_APTRS&metric=security_rating&branch=main)](https://sonarcloud.io/summary/new_code?id=Anof-cyber_APTRS&branch=API)
[![Vulnerabilities](https://sonarcloud.io/api/project_badges/measure?project=Anof-cyber_APTRS&metric=vulnerabilities)](https://sonarcloud.io/summary/new_code?id=Anof-cyber_APTRS)
[![Quality Gate Status](https://sonarcloud.io/api/project_badges/measure?project=Anof-cyber_APTRS&metric=alert_status)](https://sonarcloud.io/summary/new_code?id=Anof-cyber_APTRS)
[![CodeQL](https://github.com/Anof-cyber/APTRS/actions/workflows/codeql.yml/badge.svg)](https://github.com/Anof-cyber/APTRS/actions/workflows/codeql.yml)
[![Twitter](https://img.shields.io/twitter/follow/ano_f_)](https://twitter.com/Ano_F_)
![GitHub contributors from allcontributors.org](https://img.shields.io/github/all-contributors/aptrs/aptrs)


## Documentation

> [!Note]  
> Please ensure to review the Installation and Deployment Guide from the documentation.



[<img src="https://i.ibb.co/qnssqbJ/doc.png" alt="APTRS Documentation" width="220" height="45">](https://aptrs.com) [<img src="https://run.pstmn.io/button.svg" alt="Run In Postman" width="220" height="45">](https://www.postman.com/aptrs-api)



- Try APTRS Live - [https://live.aptrs.com](https://live.aptrs.com)

> [!NOTE]  
> Default creds are sourav.kalal@aptrs.com & I-am-Weak-Password-Please-Change-Me

Quick Installation

> [!Warning]  
> Please ensure to review the documentation for Security Configuration for ENV and other Installation methods.

```bash
git clone https://github.com/APTRS/APTRS
cd APTRS
cp env.docker .env
nano .env
docker-compose up 
```





## Features
- Manage Vulnerabilities
- Custom Report Template in Docx or HTML/CSS
- Manage All Projects in one place
- Maintain the Vulnerability Database
- Easily Generate PDF, DOCX and Excel Report
- Easily Customize PDF and DOCX Report Template
- Dynamically add POC, Description and Recommendations
- Manage Customers and Companies
- Manage Project Status, Schedules and Retest


## Support APTRS

If you've found APTRS helpful and valuable, please consider supporting the project. Your donations are crucial in helping maintain and improve APTRS, which is primarily maintained by a single dedicated developer. Your support will ensure the continued development of new features, timely updates, and the overall sustainability of the project. Every contribution, no matter how small, makes a significant difference and is greatly appreciated. Thank you for your generosity and support!
<div style="display: flex; flex-direction: column; align-items: center; border: 1px solid #000; padding: 10px; width: 350px;"><b>Bitcoin</b>
  <img src="https://raw.githubusercontent.com/APTRS/APTRS-Changelog/refs/heads/main/images/BTC.png" alt="BTC Wallet QR Code" width="200" height="200">
  <p style="margin-top: 10px; text-align: center;">bc1qusxngf2w5gl2g8hw82ggct59227k4963f9fwhm</p>
</div>
<br/><br/>
<a href="https://github.com/sponsors/APTRS"><img src="https://img.shields.io/static/v1?label=Sponsor&message=%E2%9D%A4&logo=GitHub&color=%23fe8e86" alt="Sponsor APTRS" width="230" height="50"></a>
<br/><br/>



## Sponsor

<p>This project is supported by:</p>
<p>
  <a href="https://m.do.co/c/daa899c901f2">
    <img src="https://opensource.nyc3.cdn.digitaloceanspaces.com/attribution/assets/SVG/DO_Logo_horizontal_blue.svg" width="201px">
  </a>
</p>


## Security

If you discover any security vulnerabilities in this open-source project, please responsibly disclose it by referring to our [Security Policy](https://github.com/Anof-cyber/APTRS/security/policy). We appreciate and value your efforts to improve the security of this project.

## Contributors ✨

<!-- ALL-CONTRIBUTORS-LIST:START - Do not remove or modify this section -->
<!-- prettier-ignore-start -->
<!-- markdownlint-disable -->
<table>
  <tbody>
    <tr>
      <td align="center" valign="top" width="14.28%"><a href="https://souravkalal.tech/"><img src="https://avatars.githubusercontent.com/u/39705906?v=4?s=100" width="100px;" alt="Sourav Kalal"/><br /><sub><b>Sourav Kalal</b></sub></a><br /><a href="#maintenance-anof-cyber" title="Maintenance">🚧</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/djscruggs"><img src="https://avatars.githubusercontent.com/u/41671?v=4?s=100" width="100px;" alt="DJ Scruggs"/><br /><sub><b>DJ Scruggs</b></sub></a><br /><a href="https://github.com/APTRS/APTRS/commits?author=djscruggs" title="Code">💻</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/noraj"><img src="https://avatars.githubusercontent.com/u/16578570?v=4?s=100" width="100px;" alt="Alexandre ZANNI"/><br /><sub><b>Alexandre ZANNI</b></sub></a><br /><a href="https://github.com/APTRS/APTRS/commits?author=noraj" title="Code">💻</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/0xdeviner"><img src="https://avatars.githubusercontent.com/u/61959752?v=4?s=100" width="100px;" alt="Hitesh Patra"/><br /><sub><b>Hitesh Patra</b></sub></a><br /><a href="https://github.com/APTRS/APTRS/commits?author=0xdeviner" title="Code">💻</a></td>
    </tr>
  </tbody>
</table>

<!-- markdownlint-restore -->
<!-- prettier-ignore-end -->

<!-- ALL-CONTRIBUTORS-LIST:END -->


## Authors

- [Sourav Kalal](https://twitter.com/Ano_F_)
