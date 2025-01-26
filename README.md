[![lint](https://github.com/PermanentOrg/stela/actions/workflows/lint.yml/badge.svg)](https://github.com/PermanentOrg/stela/actions/workflows/lint.yml)
[![unit tests](https://github.com/PermanentOrg/stela/actions/workflows/test.yml/badge.svg)](https://github.com/PermanentOrg/stela/actions/workflows/test.yml)
[![codecov](https://codecov.io/gh/PermanentOrg/stela/branch/main/graph/badge.svg?token=4LYJGPGU57)](https://codecov.io/gh/PermanentOrg/stela)

# Stela: A Monolithic Typescript Backend for Permanent.org

## Documentation

Historically, documentation of this repo's API server was kept in https://github.com/PermanentOrg/stela/blob/main/API.md.
We are now adopting the OpenAPI specification format for API documentation; new endpoints are documented in this fashion.
To generate an HTML copy of the OpenAPI documentation, run

```bash
redocly build-docs packages/api/docs/present/api.yaml
```

Then open redoc-static.html to view the docs in browser.

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
npm install -ws
```

4. `psql` needs to be installed for running tests

## Environment Variables

Depending on the work being done, some environment variable will not be required for the service to run.
For these, simply fill in any fake value to prevent `require-env-variable` from throwing errors.

| Variable                          | Default                                               | Notes                                                                                                                       |
| --------------------------------- | ----------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| ENV                               | local                                                 | Tells stela what environment it's running in                                                                                |
| DATABASE_URL                      | postgres://postgres:permanent@database:5432/permanent | Run tests to generate default database                                                                                      |
| PORT                              | 8080                                                  | Tells stela what port to run on                                                                                             |
| FUSIONAUTH_HOST                   | <none. needs to be set>                               | Fusionauth's host URL. Should be different between prod and other envs.                                                     |
| FUSIONAUTH_API_KEY                | <none. needs to be set>                               | Find it in Fusionauth admin panel -> settings -> API keys -> the one called "back-end (local)"                              |
| FUSIONAUTH_TENANT                 | <none. needs to be set>                               | Find it in Fusionauth admin panel -> Tenants -> the one called "Local"                                                      |
| FUSIONAUTH_BACKEND_APPLICATION_ID | <none. needs to be set>                               | Find it in Fusionauth admin panel -> Applications -> the one called "back-end (local)"                                      |
| FUSIONAUTH_ADMIN_APPLICATION_ID   | <none. needs to be set>                               | Find it in Fusionauth admin panel -> Applications -> the one called "admin-local"                                           |
| LEGACY_BACKEND_HOST_URL           | http://load_balancer:80/api                           |
| LEGACY_BACKEND_SHARED_SECRET      | none                                                  | Can be found in `back-end`'s library/base/constants/base.constants.php                                                      |
| MAILCHIMP_API_KEY                 | none                                                  | Can be found in `back-end`'s library/base/constants/base.constants.php                                                      |
| MAILCHIMP_TRANSACTIONAL_API_KEY   | none                                                  | Can be found in `back-end`'s library/base/constants/base.constants.php, where it is called `MANDRILL_API_KEY`               |
| MAILCHIMP_DATACENTER              | us12                                                  |
| MAILCHIMP_COMMUNITY_LIST_ID       | 2736f796db                                            | The default value corresponds to the `dev` list                                                                             |
| SENTRY_DSN                        | none                                                  | Can be found in Sentry under Projects > stela > Settings > Client Keys (DSN)                                                |
| DEV_NAME                          | none                                                  | Only set in local environments. Should be your given name. all lowercase. Used to create Sentry envs for developers         |
| AWS_REGION                        | us-west-2                                             |                                                                                                                             |
| AWS_ACCESS_KEY_ID                 | none                                                  | The same one you use in `devenv`                                                                                            |
| AWS_SECRET_ACCESS_KEY             | none                                                  | The same one you use in `devenv`                                                                                            |
| LOW_PRIORITY_TOPIC_ARN            | test                                                  | Doesn't need to be set to a real ARN unless your work touches it specifically                                               |
| EVENT_TOPIC_ARN                   | test                                                  | Doesn't need to be set to a real ARN unless your working with events specifically                                           |
| MIXPANEL_TOKEN                    | none                                                  | Found in Mixpanel at Settings > Project Settings > Project Token                                                            |
| ARCHIVEMATICA_BASE_URL            | none                                                  | It is the url of the EC2 instance on which archivematica is running                                                         |
| ARCHIVEMATICA_API_KEY             | none                                                  | Found in Bitwarden, not needed unless you're running the cleanup cron                                                       |
| CLOUDFRONT_URL                    | none                                                  | Can be found as `CDN_URL` in `back-end`'s library/base/constants/base.constants.php. Not required for API server            |
| CLOUDFRONT_KEY_PAIR_ID            | none                                                  | Can be found as `CLOUDFRONT_KEYPAIR` in `back-end`'s library/base/constants/base.constants.php. Not required for API server |
| CLOUDFRONT_PRIVATE_KEY            | none                                                  | Can be found in `back-end`'s library/static/certs/pk-APKAJP2D34UGZ6IG443Q.pem. Not required for API server                  |
| SITE_URL                          | local.permanent.org                                   |

## Linting

Run

```bash
npm run lint -ws
```

## Testing

Make sure the local database from `devenv`'s docker compose is running

```bash
docker compose up -d
```

then run tests with

```bash
npm run test -ws
```

or, for a single project, specify the workspace

```bash
npm run test -w @stela/api
```

Note that the database tests run against is dropped and recreated at the beginning of each test run.
<br />

For running tests on a single file in `stela`, you can make an adjustment to the existing `test` command in **packages/api/package.json** on your machine. See the example below (replace **src/middleware/authentication.test.ts** with a pattern to match your file):

```json
    "test:file": "npm run start-containers && npm run clear-database && npm run create-database && npm run set-up-database && (cd ../..; docker compose run stela node --experimental-vm-modules ../../node_modules/jest/bin/jest.js -i --silent=false -- src/middleware/authentication.test.ts)",
```

## Running the API Server Locally

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
npm run start -w @stela/api
```

## Running Lambdas Locally

1. Build the lambda image

```bash
docker build --platform linux/amd64 -t <LAMBDA NAME>:test -f Dockerfile.<LAMBDA NAME> .
```

2. Run the lambda container. Add additional --env arguments as needed. Note that the `CLOUDFRONT_PRIVATE_KEY` required
   by the `record_thumbnail_attacher` must include literal newlines; docker does not appear to interpret `\n` correctly.

```bash
docker run --platform linux/amd64 -p 9001:8080 --env DATABASE_URL=postgres://postgres:permanent@database:5432/permanent <LAMBDA NAME>:test
```

3. Find the container name

```bash
docker ps
```

4. Connect to the local env docker network

```bash
docker network connect devenv_default <YOUR CONTAINER NAME>
```

5. Trigger the lambda

```bash
curl "http://localhost:9001/2015-03-31/functions/function/invocations" -d '<YOUR PAYLOAD>'
```

## Deployment

### To `dev`

`stela` deploys to `dev` automatically upon any merge to `main`.

### Beyond `dev`

To deploy to `staging` and `prod`, create a Release with a tag of the form `vX.X.X` (this should conform to semantic
versioning). This will trigger a deploy to staging. If that is successful, the workflow will pause and wait for manual
approval to deploy to prod. Given manual approval, it will deploy to prod.

### To `staging` Only

To deploy to `staging` without deploying to prod, run the "Deploy to staging" workflow from the Actions tab.

### Updating Test Cluster Infrastructure

Because `dev` and `staging` run on the same EKS cluster, deploys to each of these environments just target the `stela`
deployments and won't update the underlying infrastructure they run on. To update that infrastructure, manually trigger
the "Deploy to all test envs" workflow from the Actions tab in Github. This will deploy the current `main` branch to
`dev` and `staging` in addition to updating the test cluster infrastructure.
