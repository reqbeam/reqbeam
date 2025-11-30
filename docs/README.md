# Reqbeam Documentation

This directory contains the documentation for Reqbeam, which is published to GitHub Pages at https://reqbeam.github.io/reqbeam/

## Structure

- `index.md` - Main documentation landing page
- `installation.md` - Installation guide
- `quick-start.md` - Quick start guide
- `web-interface.md` - Web interface documentation
- `cli.md` - CLI tool documentation
- `api-reference.md` - API reference documentation
- `cli docs/` - Detailed CLI documentation
- Other feature-specific documentation files

## GitHub Pages Setup

This documentation is configured to work with GitHub Pages using Jekyll.

### To Enable GitHub Pages:

1. Go to your repository settings on GitHub
2. Navigate to "Pages" section
3. Under "Source", select "Deploy from a branch"
4. Select "main" branch and "/docs" folder
5. Click "Save"

The documentation will be available at: `https://reqbeam.github.io/reqbeam/`

## Local Development

To preview the documentation locally:

```bash
# Install Jekyll (if not already installed)
gem install bundler jekyll

# Navigate to docs directory
cd docs

# Serve locally
jekyll serve

# Or with baseurl
jekyll serve --baseurl /reqbeam
```

The documentation will be available at http://localhost:4000/reqbeam/

