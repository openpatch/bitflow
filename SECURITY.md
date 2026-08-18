# Security

## The threat model, in one line

bitflow runs entirely in the learner's browser, so the learner controls the
assessment. This is by design, and it is the reason bitflow is a practice tool
rather than an exam tool.

[What bitflow is not for](README.md#what-bitflow-is-not-for) in the README
spells that out. In short: the answer key ships with the document, the grading
is JavaScript on the learner's page, and a restored attempt is checked for
shape and not for honesty. Reports of the form "I can see the answers in
devtools" or "I can forge a perfect attempt" describe intended behaviour, and
we will close them as such.

## What we do treat as a vulnerability

Everything that is *not* the learner cheating themselves:

- **Author content escaping sanitisation.** Bit content is Markdown written by
  a teacher and rendered with DOMPurify. If a `.bitflow` document can execute
  script in the embedding page, that is a vulnerability — the document may come
  from a shared library or an untrusted upload, and the page around it is not
  the author's to compromise.
- **A document that breaks out of its element** — reading or altering the host
  page beyond where it was mounted, or reaching the host's storage.
- **Crashing or hanging the page from a crafted document** rather than
  reporting a typed `BitflowError`. Every load path is meant to validate before
  it renders.
- **Anything in the reporting packages that leaks one learner's data into
  another's view** when a host renders several attempts.
- Supply-chain problems in what we publish: a dependency with a known advisory,
  or a package shipping files it should not.

## Reporting

Open a [security advisory](https://github.com/openpatch/bitflow/security/advisories/new)
rather than a public issue. A working `.bitflow` document or HTML page that
reproduces the problem is worth more than a description.

We aim to acknowledge within a week. bitflow is a library with no hosted
service behind it, so a fix means a release and hosts updating their
dependency; we will say in the advisory which versions are affected.

## Supported versions

The latest published major of each package. bitflow is pre-1.0 and there are
no long-term support branches.
