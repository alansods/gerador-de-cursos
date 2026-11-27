# Signup sends the email

## Description

When the login changed from a username to an email, `POST /api/auth/signup` started
requiring `email`. The signup page was not updated: it still sent `username` (the part
of the email before `@`) and no `email`, so every signup failed with 400
("Nome, e-mail e senha são obrigatórios"). Found while creating a test account for SENAI.

The page now sends the email the person typed, trimmed. The route already normalizes it
to lowercase.

## Decisions

- The page sends `{ name, email, password }`, the fields the route reads.
- The route stays as it is: it already validates and normalizes the email.
- Accounts created through signup stay `CONTENT_AUTHOR`. Another role (such as
  `MANAGER`) is set by an ADMIN in `/users`.

## Scope

- Out of scope: changing which role signup grants.
- Out of scope: renaming the page's pt-BR error keys (`nome`, `senha`…).

## Checklist

- [x] Send `email` instead of `username` in `src/app/(app)/signup/page.tsx`.
      Pronto quando: the request body has `name`, `email` and `password`, and no `username`.
- [ ] Verify the signup in the browser.
      Pronto quando: signing up with a new email returns 200 and that email can log in.
