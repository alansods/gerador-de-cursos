# Proprietary license

## Description

The README declared the project as MIT ("open source"), which allows anyone to copy,
modify and redistribute the code. The author wants the project to be proprietary: the
code may be viewed where it is published, but copying, modifying, redistributing or
using it without written permission is not allowed.

## Decisions

- `LICENSE` file at the root with an "All rights reserved" proprietary notice, held by
  Alan Santos.
- `package.json` declares `"license": "UNLICENSED"` (npm's value for proprietary code)
  alongside the existing `"private": true`.
- README's License section points to `LICENSE` instead of MIT.

## Scope

- Out of scope: changing the GitHub repository visibility. A license forbids copying
  legally but does not hide the code; making the repository private is a separate
  action the author does in the GitHub settings.
- Out of scope: obfuscating the SCORM player bundle shipped inside the package.

## Checklist

- [x] Add `LICENSE` with the proprietary notice.
      Pronto quando: the file exists at the root and states all rights reserved.
- [x] Set `"license": "UNLICENSED"` in `package.json`.
      Pronto quando: the field is present and the JSON is valid.
- [x] Replace the MIT mention in the README.
      Pronto quando: `grep -i mit README.md` finds no license mention.
