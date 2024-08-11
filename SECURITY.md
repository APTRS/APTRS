# Security Policy

## Supported Versions

Please refer to this table to understand the currently supported versions of the project that receive security updates.

| Version | Supported          |
| ------- | ------------------ |
| 0.x.x   | :x:                |
| 1.x.x   | :white_check_mark: |


## Reporting a Vulnerability

We appreciate and encourage responsible disclosure of security vulnerabilities within this open-source project. If you discover any vulnerabilities or security issues, please report them to us by emailing kalalsourav20@gmail.com. We value your efforts to enhance the security of this project and kindly request that you provide details on the vulnerability discovered.

Please note that this project is an open-source initiative and, as such, we do not offer monetary rewards for reported vulnerabilities. However, contributors who responsibly disclose valid issues will be acknowledged and credited within the project.


**Important Security Considerations for APTRS:**

- **Rate Limiting:** The application includes features that could be affected by rate limiting; however, reports on rate limiting will not be considered security issues unless they demonstrate further exploitation that could lead to significant impact or compromise of the system.

- **High-Priority Vulnerabilities:** APTRS utilizes features that may lead to the following security concerns:
  - **Server-Side Template Injection (SSTI):** Due to dynamic template rendering features for HTML to PDF and DOCX reports using Jinja2 with `docxtpl`.
  - **Path Traversal:** Because of the file access functionalities, especially in the delete image API.
  - **File Upload Vulnerabilities:** Given the application's support for file uploads, particularly for Proof of Concept (POC) image uploads.
  - **Server-Side Request Forgery (SSRF):** Due to the application’s interaction with external URLs in HTML to PDF and DOCX reports.

- **User Configuration Requirements:** Some security implementations require configuration from users, such as whitelisted IPs or domains. Bypassing such restrictions will be considered a security issue, whereas misconfigured settings from the user end will not be treated as a vulnerability.

  These areas are critical for APTRS, and we have implemented robust security checks to prevent exploitation. However, due to the inherent risks associated with these features, we are particularly concerned about potential bypasses or misconfigurations. Reports identifying vulnerabilities or bypasses in these categories will be treated with the highest priority.
