//
// app.js - HTTP server which accepts PUT requests and uses mathjax to
// render the provided TeX as SVG via MathJax.
//
// The SHA-256 HMAC of the request body should be hex-encoded and sent
// as the `x-mathyd-hmac-sha256` header.
//
// The body of the request should be a JSON object with the following
// properties:
//
// * type: Output format. Must have the value of "svg".  Required.
// * tex: String containing TeX data.  Required.
//
// On success, returns a JSON object in the response body with the
// following properties:
//
// * svg: SVG contents
//
// On error, returns an error code and a JSON-encoded error in the body
// of the response.
//
// Configuration is managed with the following environment variables:
//
// * MATHYD_PORT: Port.  Optional, defaults to "3000" if unspecified.
// * MATHYD_HMAC_KEY: HMAC key.  Required.
// * MATHYD_MATHJAX_PACKAGES: Comma-delimited list of MathJax packages.
//   Optional, defaults to `base, autoload, require, ams, newcommand` if
//   unspecified.
//

"use strict";

// configuration
const PORT = parseInt(process.env.MATHYD_PORT || '3000', 10);
const HMAC_KEY = process.env.MATHYD_HMAC_KEY;
const MATHJAX_PACKAGES = process.env.MATHYD_MATHJAX_PACKAGES || 'base, autoload, require, ams, newcommand';

// load libraries
const crypto = require('crypto');
const express = require('express');
const app = express();

// body handler
app.use(express.text({
  type: 'application/json',
  verify: (req, res, buf, enc) => {
    const header_hmac = req.get('x-mathyd-hmac-sha256') || '';
    const body_hmac = crypto.createHmac('sha256', HMAC_KEY)
            .update(buf)
            .digest('hex');

    // check hmac key
    if (!HMAC_KEY) {
      throw new Error('hmac key not set');
    }

    if (header_hmac !== body_hmac) {
      throw new Error('hmac mismatch');
    }
  },
}));

// error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.set({ 'Content-Type': 'application/json' }).status(500).send({
    error: err.message,
  });
});

const HELP_HTML = `
<!DOCTYPE html>
<html>
  <head><title>mathyd</title></head>
  <body>
    <h1>mathyd</h1>

    <p>
      HTTP server which accepts PUT requests and uses mathjax to render
      the provided TeX as SVG via MathJax.
    </p>

    <p>
      The SHA-256 HMAC of the request body should be hex-encoded and sent
      as the <code>x-mathyd-hmac-sha256</code> header.
    </p>

    <p>
      The body of the request should be a JSON object with the following
      properties:
    </p>

    <ul>
      <li>
        <b>type</b>: Output format. Must have the value of "svg".
        Required.
      </li>

      <li>
        <b>tex</b>: String containing TeX data.  Required.
      </li>
    </ul>

    <p>
      On success, returns a JSON object in the response body with the
      following properties:
    </p>

    <ul>
      <li>
        <b>svg</b>: SVG contents.
      </li>
    </ul>

    <p>
      On error, returns an error code and a JSON-encoded error in the
      body of the response.
    </p>

    <p>
      Configuration is managed with the following environment variables:
    </p>

    <ul>
      <li>
        <b>MATHYD_PORT</b>: Port.  Optional, defaults to "3000" if
        unspecified.
      </li>

      <li>
        <b>MATHYD_HMAC_KEY</b>: HMAC key.  Required.
      </li>

      <li>
        <b>MATHYD_MATHJAX_PACKAGES</b>: Comma-delimited list of MathJax
        packages. Optional, defaults to <code>base, autoload, require, ams, newcommand</code>
        if unspecified.
      </li>
    </ul>
  </body>
</html>
`;

// load mathjax
require('mathjax-full').init({
  // mathjax config
  options: {
    enableAssistiveMml: false,
  },

  loader: {
    source: require('mathjax-full/components/src/source.js').source,
    load: ['adaptors/liteDOM', 'tex-svg'],
  },

  tex: {
    packages: MATHJAX_PACKAGES.split(/\s*,\s*/)
  },

  svg: {
    fontCache: 'local',
  },

  startup: {
    typeset: false
  },
}).then((MathJax) => {
  // bind to get
  app.get('/', (req, res) => {
    res.send(HELP_HTML);
  });

  app.put('/', (req, res) => {
    console.log('req.body = ' + req.body);
    const data = JSON.parse(req.body);

    // check type
    if (data.type !== 'svg') {
      console.log('invalid type');
      res.status(403).send('invalid type').end();
      return;
    }

    // check tex
    if (!data.tex) {
      console.log('missing tex');
      res.status(403).send('missing tex').end();
      return;
    }

    MathJax.tex2svgPromise(data.tex || '', {
      display: !data.inline,
      em: data.em || 8,
      ex: data.ex || 16,
      containerWidth: data.width || 1024,
    }).then((node) => {
      const adaptor = MathJax.startup.adaptor;
      res.set({
        'Content-Type': 'application/json',
      }).send(JSON.stringify({
        svg: adaptor.innerHTML(node),
      }));
    }).catch((err) => {
      console.log(err);
      res.status(500).send(err).end();
      return;
    });
  });

  // start server
  app.listen(PORT, () => {
    console.log(`listening on http://localhost:${PORT}`)
  });
});
