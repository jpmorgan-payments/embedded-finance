# URL Size Limits & the Compact `cfg` Parameter

> **Applies to**: all Partially Hosted UI experiences (`HOSTED_ONBOARDING_UI`,
> `HOSTED_DOC_UPLOAD_ONBOARDING_UI`, `HOSTED_LINKED_ACCOUNTS_UI`, …)
>
> **Read this if**: your hosted experience returns **403 Forbidden** / "Request Denied",
> or you are passing more than a small amount of theme, content or component configuration.

---

## Table of Contents

- [The 2047-character limit](#the-2047-character-limit)
- [Diagnosing a 403](#diagnosing-a-403)
- [Your character budget](#your-character-budget)
- [Quick wins before you change anything](#quick-wins-before-you-change-anything)
- [The compact `cfg` parameter](#the-compact-cfg-parameter)
  - [Wire format](#wire-format)
  - [Reference implementations](#reference-implementations)
  - [Precedence and backwards compatibility](#precedence-and-backwards-compatibility)
- [How much configuration actually fits](#how-much-configuration-actually-fits)
- [Structural limits (independent of size)](#structural-limits-independent-of-size)
- [Encoding rules](#encoding-rules)
- [When `cfg` is not enough](#when-cfg-is-not-enough)
- [Troubleshooting](#troubleshooting)

---

## The 2047-character limit

The gateway in front of the hosted experience enforces a hard cap on the request line:

> **`path` + `?` + `query string` must be 2047 characters or fewer.**

At 2048 characters the request is rejected with **HTTP 403** and an HTML "Request Denied"
page carrying a `Support-Id` header. **This happens at the edge — the request never
reaches the application**, so no application log, no error event, and no `postMessage`
is produced.

The host name is *not* counted. The path *is*. For `/smbdo/app.html` (15 characters)
that leaves 2032 characters for `?` plus the query string.

## Diagnosing a 403

This limit produces a distinctive and very misleading symptom:

> Every parameter works **on its own**. Only the **combination** fails.

That looks like a bad parameter value, so the natural instinct is to hunt for a bad
character or a malformed JSON payload. It is neither — it is purely the total length.

**Confirm it in one step:** measure `pathname + search` of the URL you are generating.

```javascript
const u = new URL(yourGeneratedUrl);
console.log(u.pathname.length + u.search.length); // > 2047 → this is your problem
```

A real example — a partner passing `token`, `themeTokens`, `contentTokens` and
`componentProperties` produced a **2408-character** request URI. Each parameter loaded
successfully in isolation; together they returned 403.

## Your character budget

Assuming the standard `/smbdo/app.html` path and a typical ~548-character session token:

| Item | Characters |
|------|-----------:|
| `/smbdo/app.html?` | 16 |
| `token=…` | 555 |
| `&hostedExperienceType=…` | 42 |
| **Fixed subtotal** | **612** |
| **Remaining for all configuration** | **1435** |

Typical costs of the standard parameters, minified and encoded once:

| Parameter | Typical cost |
|-----------|-------------:|
| `themeTokens` (12 design tokens) | ~682 |
| `contentTokens` (2 strings) | ~405 |
| `componentProperties` (disclosures + link account) | ~622 |
| **Total** | **~1709** → **over budget** |

This is why a modest-looking configuration overflows: three parameters of ordinary size
already exceed what is left after the session token.

## Quick wins before you change anything

These require no format change and often buy back enough room:

1. **Minify your JSON.** Pretty-printed JSON with indentation is common when configuration
   is copy-pasted from a file. Indentation alone routinely costs 80–120 characters.
2. **Drop defaults and empty values.** `"initialValues": {}`, `"disclosurePlatformAgreementUrl": ""`
   and similar contribute nothing but cost characters.
3. **Encode exactly once.** See [Encoding rules](#encoding-rules) — double encoding inflates
   the URL by roughly 24%.
4. **Drop a parameter temporarily.** If you only need to test one area, omit `themeTokens`
   (usually the largest) to get back under the limit.

If that is not enough — or you want a durable solution rather than a diet — use `cfg`.

---

## The compact `cfg` parameter

`cfg` carries `themeTokens`, `contentTokens` and `componentProperties` together in a
single compressed, URL-safe parameter. The same configuration that cost ~1709 characters
as three parameters costs **~840** as one `cfg` value.

Real measurement, same partner configuration as above:

| Form | Request URI | Result |
|------|------------:|--------|
| Three standard parameters | 2408 | **403** |
| Single `cfg` parameter | **1459** | **200** |

### Wire format

```
cfg=<codec>.<base64url payload>
```

| Codec | Meaning |
|-------|---------|
| `z.` | Raw **DEFLATE** (RFC 1951 — *no* zlib or gzip header) of the UTF-8 JSON, then base64url |
| `j.` | UTF-8 JSON, then base64url — no compression. Use only if you have no deflate available |

The payload before compression is a single JSON object — the **envelope**:

```json
{
  "themeTokens":         { "…": "…" },
  "contentTokens":       { "…": "…" },
  "componentProperties": { "…": "…" }
}
```

All three keys are optional; include only what you need.

**base64url** means the standard alphabet with `+` → `-`, `/` → `_`, and trailing `=`
padding removed. Every character in that alphabet is URL-safe, so `cfg` is **never**
percent-encoded — which is precisely where the savings come from.

> ⚠️ **`hostedExperienceType` must stay a separate query parameter.** It is deliberately
> not part of the envelope, because it is read from the URL again later in the session
> lifecycle. Putting it inside `cfg` will not work.
>
> `token` likewise remains its own parameter.

A complete URL:

```
https://<host>/smbdo/app.html
  ?token=<jwt>
  &hostedExperienceType=HOSTED_ONBOARDING_UI
  &cfg=z.jVLLbtswEPwVgWcXlmU7sX0LiqLIoWiA5tRLQZMri...
```

### Reference implementations

All four snippets below were executed and verified to round-trip against the
production decoder.

**Node.js**

```javascript
const zlib = require('node:zlib');

function encodeCfg(config) {
  const json = JSON.stringify(config);           // minified by default
  const deflated = zlib.deflateRawSync(Buffer.from(json, 'utf8'), { level: 9 });
  return 'z.' + deflated.toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

const params = new URLSearchParams({
  token: sessionToken,
  hostedExperienceType: 'HOSTED_ONBOARDING_UI',
});
params.append('cfg', encodeCfg({ themeTokens, contentTokens, componentProperties }));

const url = `https://${host}/smbdo/app.html?${params}`;
```

**Java**

```java
import java.nio.charset.StandardCharsets;
import java.util.Arrays;
import java.util.Base64;
import java.util.zip.Deflater;

static String encodeCfg(String json) {
    byte[] raw = json.getBytes(StandardCharsets.UTF_8);
    // nowrap = true → raw DEFLATE (RFC 1951), no zlib header
    Deflater deflater = new Deflater(Deflater.BEST_COMPRESSION, true);
    deflater.setInput(raw);
    deflater.finish();
    byte[] buffer = new byte[raw.length + 64];
    int length = deflater.deflate(buffer);
    deflater.end();
    byte[] deflated = Arrays.copyOf(buffer, length);
    return "z." + Base64.getUrlEncoder().withoutPadding().encodeToString(deflated);
}
```

> The `nowrap = true` argument is essential. Without it `Deflater` emits a zlib header
> and the payload will be rejected.

**Python**

```python
import base64
import json
import zlib

def encode_cfg(config: dict) -> str:
    raw = json.dumps(config, separators=(",", ":")).encode("utf-8")
    compressor = zlib.compressobj(9, zlib.DEFLATED, -zlib.MAX_WBITS)  # -15 = raw DEFLATE
    deflated = compressor.compress(raw) + compressor.flush()
    return "z." + base64.urlsafe_b64encode(deflated).decode("ascii").rstrip("=")
```

> The negative `wbits` (`-zlib.MAX_WBITS`) is what selects raw DEFLATE.
> `separators=(",", ":")` removes the whitespace `json.dumps` adds by default.

**Browser** (no dependencies — `CompressionStream` is available in Chrome/Edge 103+,
Safari 16.4+, Firefox 113+)

```javascript
async function encodeCfg(config) {
  const bytes = new TextEncoder().encode(JSON.stringify(config));
  const stream = new ReadableStream({
    start(controller) { controller.enqueue(bytes); controller.close(); },
  }).pipeThrough(new CompressionStream('deflate-raw'));

  const chunks = [];
  const reader = stream.getReader();
  for (;;) {
    const { value, done } = await reader.read();
    if (done) break;
    chunks.push(value);
  }

  const deflated = new Uint8Array(chunks.reduce((n, c) => n + c.length, 0));
  let offset = 0;
  for (const chunk of chunks) { deflated.set(chunk, offset); offset += chunk.length; }

  let binary = '';
  for (const byte of deflated) binary += String.fromCharCode(byte);
  return 'z.' + btoa(binary)
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}
```

Different DEFLATE implementations produce slightly different byte lengths for the same
input (typically within a few percent). This is expected and harmless — all decode
identically.

### Precedence and backwards compatibility

`cfg` is **purely additive**. Existing URLs using the standard parameters continue to
work exactly as before, with no deprecation planned.

When both forms are present for the same key, **the standalone parameter wins**:

```
?cfg=z.…                       ← themeTokens, contentTokens, componentProperties
&themeTokens={"colorScheme":"dark"}   ← this overrides the themeTokens inside cfg
```

This lets you migrate incrementally, or override one value for a test without
re-encoding the whole envelope.

---

## How much configuration actually fits

With the standard path and a ~548-character token, `cfg` has roughly **1435 characters**
to work with (~1071 compressed bytes). What that buys depends heavily on your content,
because compression ratio depends on repetition:

| Payload | Fits in one `cfg` |
|---------|------------------:|
| Design tokens only | **~108 tokens** (~4.4 KB of raw JSON) |
| Content tokens only — repetitive/boilerplate prose | 20,000+ characters |
| Content tokens only — unique prose (worst case) | **~1,550 characters** |
| Realistic mix (a few content strings + component properties + theme) | **~55 design tokens** |

Design tokens compress extremely well — long repeated names like
`actionableAccentedBoldBackground` and repeated hex values are ideal for DEFLATE, giving
roughly 3× reduction. Unique natural-language text compresses closer to 1.4×.

**Do not treat any of these as a guaranteed number.** Always measure the URI you actually
generate, and fail loudly if it exceeds the limit:

```javascript
const uri = new URL(url);
if (uri.pathname.length + uri.search.length > 2047) {
  throw new Error(`Hosted UI URL is ${uri.pathname.length + uri.search.length} characters; limit is 2047`);
}
```

Adding this guard is strongly recommended. It converts an opaque edge 403 into an
actionable error at the point where the URL is built.

## Structural limits (independent of size)

Separately from length, each parameter is validated for shape. These limits apply
identically whether you use the standard parameters or `cfg`:

| Parameter | Max nesting depth | Arrays allowed |
|-----------|------------------:|----------------|
| `themeTokens.variables` / `.light` / `.dark` | 1 | **No** |
| `contentTokens` | 11 | **No** |
| `componentProperties` | 7 | **Yes** |

Notes:

- `themeTokens` variables are expected to be a **flat map** of token name → value. A single
  level of nested objects is tolerated; two is rejected. Array values are rejected outright.
- `contentTokens` supports the deep i18n tree
  (`tokens.<namespace>.screens.<screen>.<section>.<field>`) but **not** array values, so a
  content token cannot currently be a list.
- `componentProperties` allows arrays of primitives and arrays of objects, which is what
  makes structures such as
  `linkAccountStepOptions.bankFormConfigOverride.paymentMethods.available` work.

Values must be strings, numbers, booleans or `null`. Functions, and payloads containing
script-like patterns, are rejected.

> **Recent fix:** `componentProperties` previously allowed only 3 levels of nesting, which
> silently discarded the **entire** parameter when a deeper structure such as
> `linkAccountStepOptions.bankFormConfigOverride.paymentMethods.available` was supplied —
> the experience then rendered with defaults and no visible error. The limit is now 7, and
> validation failures name the exact offending path.

## Encoding rules

**Encode exactly once.** The most common mistake is percent-encoding a value and then
handing it to something that percent-encodes again:

```javascript
// ❌ Double-encoded — inflates the URL by ~24%
params.append('themeTokens', encodeURIComponent(JSON.stringify(themeTokens)));

// ✅ URLSearchParams encodes for you — pass the raw JSON string
params.append('themeTokens', JSON.stringify(themeTokens));
```

Double encoding turns every `{` into `%257B` instead of `%7B`. The same configuration
that costs 2321 characters single-encoded costs **2887** double-encoded — enough on its
own to push a working URL over the limit.

> **Fixed in the bundled utility.** `partially-hosted-ui-component.mjs` / `.js` previously
> double-encoded. They now emit raw JSON and let `URLSearchParams` encode once, and they
> **throw a descriptive error** if the generated URL would exceed the gateway limit — so an
> oversized configuration fails at `mount()` with an actionable message instead of an
> opaque 403. Both encoding forms remain accepted by the service, so integrations pinned to
> an older copy of the utility keep working.

`cfg` sidesteps this entirely: base64url contains no characters that require
percent-encoding, so it passes through `URLSearchParams` unchanged.

**Literal `%` in your content is safe.** Values such as `"5% cashback"` are handled
correctly regardless of which encoding form you use. So are values containing what look
like escape sequences — `"100%20off"` and `"a%2Fb"` are preserved verbatim.

## When `cfg` is not enough

If your configuration cannot be made to fit — for example a full design-system token
override of several hundred values — the URL is the wrong transport. Options:

1. **Platform-side hosted configuration.** Your configuration is stored against your
   platform ID and resolved server-side, so the URL carries only the session token.
   There is no size limit. Contact your J.P. Morgan technical contact to set this up —
   this is the recommended path for large or stable configuration.
2. **Trim to what differs from the default.** Most theme overrides only need the handful
   of tokens that actually differ from the base theme.
3. **Split by experience.** Send only the configuration relevant to the experience type
   being launched rather than one superset for all of them.

## Troubleshooting

| Symptom | Cause | Fix |
|---------|-------|-----|
| **403** with a "Request Denied" page and `Support-Id` header | `path + query` exceeds 2047 characters | Measure the URI; switch to `cfg` |
| `mount()` throws "Generated URL is N characters" | The utility's built-in length guard caught it before the request was made | Reduce configuration or switch to `cfg` |
| Each parameter works alone, all together return 403 | Same as above — it is total length, not content | Measure the URI; switch to `cfg` |
| Page loads but configuration is ignored | The parameter failed validation and was discarded | Open the browser console — validation errors are logged and name the offending path |
| `cfg` ignored, console reports "could not decompress payload" | zlib/gzip header emitted instead of raw DEFLATE | Java: `new Deflater(level, true)`. Python: `wbits=-15`. Node: `deflateRawSync`, not `deflateSync` |
| `cfg` ignored, console reports "payload is not valid base64url" | Standard base64 used instead of base64url | Replace `+`→`-`, `/`→`_`, strip `=` padding |
| `cfg` ignored, console reports "unknown codec" | Missing or wrong prefix | The value must start with `z.` or `j.` |
| Theme partially applies | A nested or array value was rejected | Flatten `themeTokens.variables` to token → value |

---

## Related Documentation

- [PARTIALLY_HOSTED_UI_INTEGRATION_GUIDE.md](./PARTIALLY_HOSTED_UI_INTEGRATION_GUIDE.md) — end-to-end integration
- [PARTIALLY_HOSTED_UTILITY_GUIDE.md](./PARTIALLY_HOSTED_UTILITY_GUIDE.md) — the bundled JavaScript utility
