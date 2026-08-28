# GitHub Pages Setup Guide

This guide explains how to set up GitHub Pages for the Reqbeam documentation.

## Quick Setup

### Method 1: Using GitHub Settings (Recommended)

1. Go to your repository on GitHub
2. Click on **Settings**
3. Navigate to **Pages** in the left sidebar
4. Under **Source**, select:
   - **Branch**: `main` (or your default branch)
   - **Folder**: `/docs`
5. Click **Save**

Your documentation will be available at: `https://reqbeam.github.io/reqbeam/`

### Method 2: Using GitHub Actions (Automatic)

The repository includes a GitHub Actions workflow (`.github/workflows/docs.yml`) that automatically deploys the documentation when changes are pushed to the `docs/` folder.

To enable:
1. Go to repository **Settings**
2. Navigate to **Pages**
3. Under **Source**, select **GitHub Actions**
4. The workflow will automatically deploy on the next push to `docs/`

## Local Development

To preview the documentation locally before pushing:

### Prerequisites

- Ruby 3.1 or higher
- Bundler gem

### Setup

```bash
# Install Ruby dependencies
cd docs
bundle install

# Serve locally
bundle exec jekyll serve --baseurl /reqbeam
```

The documentation will be available at: `http://localhost:4000/reqbeam/`

### Without Base URL (for testing)

```bash
bundle exec jekyll serve
```

Available at: `http://localhost:4000/`

## Documentation Structure

The documentation is organized as follows:

```
docs/
├── _config.yml          # Jekyll configuration
├── _layouts/            # HTML layouts
│   └── default.html
├── index.md            # Main landing page
├── installation.md     # Installation guide
├── quick-start.md      # Quick start guide
├── web-interface.md    # Web interface docs
├── cli.md              # CLI documentation
├── api-reference.md    # API reference
├── cli docs/           # Detailed CLI docs
└── [other docs]        # Feature-specific docs
```

## URL Structure

With the base URL `/reqbeam`, the documentation URLs will be:

- Home: `https://reqbeam.github.io/reqbeam/`
- Installation: `https://reqbeam.github.io/reqbeam/installation`
- Quick Start: `https://reqbeam.github.io/reqbeam/quick-start`
- Web Interface: `https://reqbeam.github.io/reqbeam/web-interface`
- CLI: `https://reqbeam.github.io/reqbeam/cli`
- API Reference: `https://reqbeam.github.io/reqbeam/api-reference`

## Custom Domain (Optional)

To use a custom domain:

1. Create a `CNAME` file in the `docs/` directory with your domain:
   ```
   docs.example.com
   ```

2. Configure DNS settings for your domain
3. GitHub Pages will automatically detect and use the custom domain

## Troubleshooting

### Documentation Not Updating

- Wait a few minutes after pushing changes
- Check GitHub Actions for build errors
- Verify the `docs/` folder structure is correct

### Links Not Working

- Ensure all links use relative paths (e.g., `[text](page)` not `[text](#page)`)
- Check that the base URL is set correctly in `_config.yml`

### Build Errors

- Check the GitHub Actions logs
- Test locally with `bundle exec jekyll build`
- Verify all markdown files have proper front matter

## Updating Documentation

1. Edit markdown files in the `docs/` directory
2. Commit and push changes
3. GitHub Pages will automatically rebuild (or use GitHub Actions)

## Resources

- [GitHub Pages Documentation](https://docs.github.com/en/pages)
- [Jekyll Documentation](https://jekyllrb.com/docs/)
- [Markdown Guide](https://www.markdownguide.org/)

