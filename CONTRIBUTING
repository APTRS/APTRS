# Contributing to APTRS

Thank you for your interest in contributing to APTRS! This document provides guidelines and instructions for contributing to this project.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
  - [Setting Up Development Environment](#setting-up-development-environment)
  - [Project Structure](#project-structure)
- [How to Contribute](#how-to-contribute)
  - [Reporting Bugs](#reporting-bugs)
  - [Suggesting Enhancements](#suggesting-enhancements)
  - [Pull Requests](#pull-requests)
- [Development Workflow](#development-workflow)
  - [Branching Strategy](#branching-strategy)
  - [Commit Guidelines](#commit-guidelines)
  - [Code Style](#code-style)
- [Testing](#testing)
- [Documentation](#documentation)
- [Community](#community)

## Code of Conduct

This project follows our [Code of Conduct](CODE_OF_CONDUCT.md). By participating, you are expected to uphold this code.

## Getting Started

### Setting Up Development Environment

> **Note:** It is recommended to use Linux or macOS for development. Windows can work for code development, but Redis will not work properly on Windows.

#### Prerequisites

- **PostgreSQL**: Install and configure a PostgreSQL database
- **Redis**: Required for task queuing and caching
- **Poetry**: Required for dependency management (do not use pip)
- **Node.js & npm**: Required for frontend development

#### Backend Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/APTRS.git
   cd APTRS
   ```

2. **Install backend dependencies with Poetry**
   ```bash
   poetry install
   ```

3. **Configure environment variables**
   ```bash
   cp APTRS/env.example .env
   # Edit .env with your configuration including PostgreSQL and Redis details
   # Refer to the installation documentation page for detailed environment configuration
   ```

4. **First-time setup (initializes accounts, permissions, migrations, etc.)**
   ```bash
   poetry run python APTRS/manage.py first_setup
   ```

5. **Start the development server**
   ```bash
   poetry run python APTRS/manage.py runserver
   ```

#### Frontend Setup

1. **Navigate to the frontend directory**
   ```bash
   cd frontend
   ```

2. **Install frontend dependencies**
   ```bash
   npm install
   ```

3. **Configure frontend environment**
   ```bash
   cp env.example .env
   # Edit .env to include backend API domain/IP address
   ```

4. **Start the frontend development server**
   ```bash
   npm start
   ```

#### Important Domain/Port Considerations

- Backend and frontend should ideally run on the same domain and port (using a reverse proxy in production)
- In development, they can run on different ports/domains, but make sure to configure the frontend `.env` with the correct backend API address
- Certain features may not work properly when running on separate domains/ports:
  - Loading images in CKEditor after upload
  - Rendering vulnerability or project data with embedded images
  - Loading report CSS files
  - And others (refer to documentation for details)

- **Before submitting a PR**: Test your changes with both frontend and backend running on the same port/IP to ensure you don't break any domain-dependent features

### Project Structure

- `APTRS/` - Main Django project
- `accounts/` - User authentication and management
- `project/` - Project management functionality
- `vulnerability/` - Vulnerability tracking
- `utils/` - Shared utility functions
- `templates/` - HTML templates
- `frontend/` - Frontend code

## How to Contribute

### Reporting Bugs

When reporting bugs, please include:

- A clear, descriptive title
- Steps to reproduce the bug
- Expected behavior vs. actual behavior
- Screenshots if applicable
- Environment details (OS, browser, etc.)

To report a bug, open an issue using the bug report template.

### Suggesting Enhancements

Enhancement suggestions are welcome! Please provide:

- A clear description of the enhancement
- Rationale (why this would be useful)
- Possible implementation approaches if you have suggestions

### Pull Requests

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes following our [commit guidelines](#commit-guidelines)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## Development Workflow

### Branching Strategy

- `main` - Production-ready code
- `develop` - Development branch, base for feature branches
- `feature/*` - New features or improvements
- `fix/*` - Bug fixes
- `hotfix/*` - Critical fixes for production

### Commit Guidelines

- Use concise, descriptive commit messages
- Start with a verb in imperative mood (e.g., "Add", "Fix", "Update")
- Reference issue numbers when applicable

Example:
```
Add image upload functionality for project POCs

- Implement MultiPartParser for handling image uploads
- Generate unique filenames with UUID
- Store images in designated 'poc' directory
- Return URL for retrieving the image

Fixes #123
```

### Code Style

- Follow PEP 8 guidelines for Python code
- Use 4 spaces for indentation (not tabs)
- Use meaningful variable and function names
- Keep lines under 100 characters where possible
- Include docstrings for classes and functions

## Testing

- Write tests for new functionality
- Ensure all tests pass before submitting a pull request
- Run tests using:
  ```bash
  poetry run python APTRS/manage.py test
  ```

## Documentation

- Update documentation when changing functionality
- Document new features, APIs, and configuration options
- Use clear, concise language accessible to all users

## Community

- Join our community discussions
- Help answer questions from other contributors
- Share your experiences using the project

Thank you for contributing to APTRS!