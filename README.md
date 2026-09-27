# RELRO Security — site

Static Jekyll site. One home page plus Markdown articles.

## Local
    bundle install
    bundle exec jekyll serve

## Adding an article
Drop a file in `_posts/` named `YYYY-MM-DD-slug.md`:

    ---
    layout: post
    title: "Title"
    topic: Chain of trust
    intro: "One sentence shown under the title and in the index."
    ---

    Body in Markdown.

Nothing else to touch. It appears on `/writing/` automatically.

## Structure
    _config.yml          site settings and nav
    _layouts/default     shell: head, nav, background, footer
    _layouts/post        article page
    _layouts/page        standalone page
    _includes/logo.svg   logo, used in nav and footer
    assets/css/main.css  all styling
    assets/js/tree.js    background canvas
    index.html           home page
    writing.md           article index
