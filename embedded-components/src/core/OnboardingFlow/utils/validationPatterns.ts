export const NAME_PATTERN = /^[a-zA-Z0-9()_/@&+%#;,.: '-]*$/;
export const SUFFIX_PATTERN = /^[A-Za-z.IVX]*$/;

/**
 * "Other" job-title / occupation description (non-empty segment).
 * Characters align with {@link NAME_PATTERN} (plus slashes, parens from names, `\s`)
 * plus `?"!` and Unicode slash/dash substitutes often pasted from word processors.
 * Empty string is allowed at schema level when title is not Other.
 */
export const JOB_TITLE_DESCRIPTION_PATTERN =
  /^[a-zA-Z0-9()_/@&+%#;:,.?\s'"!\\\u2013\u2014\u2215\u2044-]+$/;
