[![lint](https://github.com/PermanentOrg/stela/actions/workflows/lint.yml/badge.svg)](https://github.com/PermanentOrg/stela/actions/workflows/lint.yml)
[![unit tests](https://github.com/PermanentOrg/stela/actions/workflows/test.yml/badge.svg)](https://github.com/PermanentOrg/stela/actions/workflows/test.yml)
[![codecov](https://codecov.io/gh/PermanentOrg/stela/branch/main/graph/badge.svg?token=4LYJGPGU57)](https://codecov.io/gh/PermanentOrg/stela)

# Stela: A Monolithic Typescript Backend for Permanent.org

## Setup

1. Create a `.env` file

```bash
cp .env.template .env
```

Update values as needed (see [Environment Variables](#environment-variables).

2. Install Node.js version 18 (doing this using [nvm](https://github.com/nvm-sh/nvm) is recommended).

3. Install dependencies

```bash
npm install
```

## Environment Variables

| Variable                          | Default                                               | Notes                                                                                                         |
| --------------------------------- | ----------------------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| ENV                               | local                                                 | Tells stela what environment it's running in                                                                  |
| DATABASE_URL                      | postgres://postgres:permanent@database:5432/permanent | Run tests to generate default database                                                                        |
| PORT                              | 8080                                                  | Tells stela what port to run on                                                                               |
| FUSIONAUTH_HOST                   | none                                                  | Can be found in `back-end`'s library/base/constants/base.constants.php                                        |
| FUSIONAUTH_API_KEY                | none                                                  | Can be found in `back-end`'s library/base/constants/base.constants.php                                        |
| FUSIONAUTH_TENANT                 | none                                                  | Can be found in `back-end`'s library/base/constants/base.constants.php                                        |
| FUSIONAUTH_BACKEND_APPLICATION_ID | none                                                  | Can be found in `back-end`'s library/base/constants/base.constants.php                                        |
| FUSIONAUTH_ADMIN_APPLICATION_ID   | none                                                  | Can be found in the FusionAuth Admin application                                                              |
| LEGACY_BACKEND_HOST_URL           | http://load_balancer:80/api                           |
| LEGACY_BACKEND_SHARED_SECRET      | none                                                  | Can be found in `back-end`'s library/base/constants/base.constants.php                                        |
| MAILCHIMP_API_KEY                 | none                                                  | Can be found in `back-end`'s library/base/constants/base.constants.php                                        |
| MAILCHIMP_TRANSACTIONAL_API_KEY   | none                                                  | Can be found in `back-end`'s library/base/constants/base.constants.php, where it is called `MANDRILL_API_KEY` |
| MAILCHIMP_DATACENTER              | us12                                                  |
| MAILCHIMP_COMMUNITY_LIST_ID       | 2736f796db                                            | The default value corresponds to the `dev` list                                                               |

## Testing

Make sure the local database from `devenv`'s docker compose is running

```bash
docker compose up -d
```

then run tests with

```bash
npm run test
```

Note that the database tests run against is dropped and recreated at the beginning of each test run.

## Running Locally

Preferred method: From the `devenv` repo, run

```bash
docker compose up -d
```

or if you've added or updated dependencies, run

```bash
docker compose up -d --build stela
```

Outside a container: Run

```bash
npm run start
```
