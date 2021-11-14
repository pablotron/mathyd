// to run: node -r esm app.js
// to test: curl -XPUT -d '{}' -H 'Content-Type: application/json' -H 'x-mathyd-hmac-sha256: 77325902caca812dc259733aacd046b73817372c777b8d95b402647474516e13' http://meh.wg:3000
//
// >> OpenSSL::HMAC.hexdigest('sha256', 'secret', '{}')
// => "77325902caca812dc259733aacd046b73817372c777b8d95b402647474516e13"
//
// >> OpenSSL::HMAC.hexdigest('sha256', 'secret', "{\"type\":\"svg\",\"tex\":\"x = \\\\sin \\\\left( \\\\frac{\\\\pi_{-1}^{2\\\\pi}}{3.1415} \\\\right)\"}")
// => "37b485e7ba3b9d764012118aeca66965a045fab1623abff280f6da033f7efbac"
//
// curl -XPUT -d "{\"type\":\"svg\",\"tex\":\"x = \\\\sin \\\\left( \\\\frac{\\\\pi_{-1}^{2\\\\pi}}{3.1415} \\\\right)\"}" -H 'Content-Type: application/json' -H 'x-mathyd-hmac-sha256: 37b485e7ba3b9d764012118aeca66965a045fab1623abff280f6da033f7efbac' http://meh.wg:3000/


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
    res.send('Usage: PUT / with a JSON body');
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
