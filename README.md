# ithyno documentation site

This repository contains only the source and deployment workflow for the
ithyno documentation site. Application code and OpenSpec change artifacts
live in the separate [`fluentdb-dev/ithyno`](https://github.com/fluentdb-dev/ithyno)
repository.

## Local preview

```bash
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
mkdocs serve
```

Open <http://localhost:8000/>.

## Publishing

Push changes to `main`. The `Docs (GitHub Pages)` workflow runs
`mkdocs build --strict` and deploys the generated site. GitHub Pages must use
**GitHub Actions** as its source in the repository settings.

The intended remote repository is `fluentdb-dev/ithyno-pages`. Until that
repository is created, this local repository intentionally has no `origin`.
