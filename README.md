# Mathyd

Minimal [HTTP][] daemon which converts [TeX][] to [SVG][].

## Usage (Docker Image)

Running the docker image:

```sh
# replace MATHYD_HMAC_KEY with a secret key
docker run --rm -d -e MATHYD_HMAC_KEY=secret -p 3000:3000 pablotron/mathyd:latest
```

## Usage (Command-Line Client)

Given this input [TeX][] file:

```tex
% quadratic formula
x = \frac{-b \pm \sqrt{b^2 - 4ac}}{2a}
```

Run the following command:

```sh
# set URL and HMAC key
export MATHYD_URL=http://whatever.example.com:3000/
export MATHYD_HMAC_KEY=secret

# render output
bin/mathy < quadratic.tex > quadratic.svg
```

You can pipe directly into standard input, but you'll need a ludicrous
number backslashes to handle shell escaping:

```sh
# set URL and HMAC key
export MATHYD_URL=http://whatever.example.com:3000/
export MATHYD_HMAC_KEY=secret

# render tex, save SVG to quadratic.svg
# (all the double escapes are necessary because of the shell)
echo "x = \\\\frac{-b \\\\pm \\\\sqrt{b^2 - 4ac}}{2a}" | \
  bin/mathy > quadratic.svg
```

## Request Protocol

*TBD*.  See `bin/mathy` for example.

## Examples

See `examples/` for sample [TeX][] files.

[http]: https://en.wikipedia.org/wiki/Hypertext_Transfer_Protocol
  "HyperText Transfer Protocol"
[tex]: https://en.wikipedia.org/wiki/TeX
  "The TeX typesetting system."
[svg]: https://en.wikipedia.org/wiki/Scalable_Vector_Graphics
  "Scalable Vector Graphics"
[mathjax]: https://mathjax.org/
  "Math rendering library."
