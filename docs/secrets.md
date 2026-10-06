# Secrets

The **Secrets** workspace manages development variables in the project's
dotenv-compatible `.env*` profiles. It is available from the dashboard's
top navigation.

## Select a profile

ithyno discovers `.env` and `.env.<profile>` files in the project root. Select
the profile that new Manager terminals and workers should use. If no profile
exists, create the first one from the same page.

Changes apply to newly launched processes. Restart an existing Manager from the
terminal refresh control before expecting it to receive a new profile or
updated value.

## Manage values safely

Values are masked until you reveal them. The action icons let you reveal or
hide, copy, edit, or delete an individual value. Edits and deletions are staged
for review before the profile is saved.

Keep real `.env*` files out of version control. Commit example files containing
placeholders instead.

## Encrypt a profile

Choose **Encrypt profile** beside the active profile. ithyno uses its bundled
dotenvx runtime and creates or updates the project-root `.env.keys` file. The
confirmation explains the affected profile and adds `.env.keys` to
`.gitignore` without rewriting unrelated rules.

`.env.keys` contains the private decryption keys. Never commit or publish it.
Encrypted `.env*` files can be committed only when that matches your project's
security policy.

When dotenvx Native is available, ithyno may also offer:

- **Move key to OS storage** — stores the key in OS secure storage and removes
  that profile key from `.env.keys`.
- **Copy key to OS storage** — stores an additional OS copy and retains
  `.env.keys`.

These actions are optional; the standard local workflow continues to use
`.env.keys`.

## Delete a profile

Use the trash icon beside the active profile and confirm the exact file path.
Deleting a profile removes only that `.env*` file. Its private key is retained
in `.env.keys` or OS storage until you remove it separately.

## CI and agent processes

For CI, supply `DOTENV_PRIVATE_KEY` or the matching profile-specific key, such
as `DOTENV_PRIVATE_KEY_DEVELOPMENT`, through the CI platform's secret store.

ithyno resolves the selected profile before starting a Manager or worker. The
process receives the resolved application values, but not the dotenvx private
key itself.
