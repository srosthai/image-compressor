# CompressIt

A browser tool for smaller images, PDFs, spreadsheets, documents, and text files. Files stay on the device.

The public site is [https://compress.srosthai.me/](https://compress.srosthai.me/).

## Run it locally

```bash
python3 -m http.server 8080
```

Open http://localhost:8080.

## Search setup

After deploy, submit `https://compress.srosthai.me/sitemap.xml` in [Google Search Console](https://search.google.com/search-console) and [Bing Webmaster Tools](https://www.bing.com/webmasters). Verify the property for `compress.srosthai.me`. The verification file in this repo is `google50917d752e962737.html`.

Indexable pages use a self-referencing canonical on `https://compress.srosthai.me`, Open Graph and Twitter cards, and one `h1`. The homepage includes WebApplication JSON-LD. `404.html` is `noindex` and is not in the sitemap.
