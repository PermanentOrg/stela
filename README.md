[![lint](https://github.com/PermanentOrg/stela/actions/workflows/lint.yml/badge.svg)](https://github.com/PermanentOrg/stela/actions/workflows/lint.yml)
[![unit tests](https://github.com/PermanentOrg/stela/actions/workflows/test.yml/badge.svg)](https://github.com/PermanentOrg/stela/actions/workflows/test.yml)
[![codecov](https://codecov.io/gh/PermanentOrg/stela/branch/main/graph/badge.svg?token=4LYJGPGU57)](https://codecov.io/gh/PermanentOrg/stela)

# Stela: A Monolithic Typescript Backend for Permanent.org

## Prerequisites

Stela is designed to run alongside the [devenv](https://github.com/PermanentOrg/devenv) development environment. Before running the API server or tests locally, you must have devenv set up and running.

The devenv provides:
- The shared Docker network (`permanent_default`) that stela containers connect to
- The PostgreSQL database
- Other dependent services (nginx load balancer, back-end PHP server, etc.)

See the [devenv README](https://github.com/PermanentOrg/devenv#readme) for setup instructions.

## Documentation

Historically, documentation of this repo's API server was kept in https://github.com/PermanentOrg/stela/blob/main/API.md.
We are now adopting the OpenAPI specification format for API documentation; new endpoints are documented in this fashion.
To generate an HTML copy of the OpenAPI documentation, run

```bash
redocly build-docs packages/api/docs/src/api.yaml
```

Then open redoc-static.html to view the docs in browser. Alternatively, see the [hosted version](https://permanentorg.github.io/stela/).

## Setup

1. Set up devenv first (see [Prerequisites](#prerequisites)).

2. Create a `.env` file

```bash
cp .env.template .env
```

Update values as needed (see [Environment Variables](#environment-variables)).

3. Install the Node.js version specified in [.node-version](https://github.com/PermanentOrg/stela/blob/main/.node-version) (using [nvm](https://github.com/nvm-sh/nvm) is recommended).

4. Install dependencies

```bash
npm install
```

## Environment Variables

Depending on the work being done, some environment variable will not be required for the service to run.
For these, simply fill in any fake value to prevent `require-env-variable` from throwing errors.

| Variable                           | Default                                               | Notes                                                                                                                       |
| ---------------------------------- | ----------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| ENV                                | local                                                 | Tells stela what environment it's running in                                                                                |
| DATABASE_URL                       | postgres://postgres:permanent@database:5432/permanent | Run tests to generate default database                                                                                      |
| PORT                               | 8080                                                  | Tells stela what port to run on                                                                                             |
| FUSIONAUTH_HOST                    | <none. needs to be set>                               | Fusionauth's host URL. Should be different between prod and other envs.                                                     |
| FUSIONAUTH_API_KEY                 | <none. needs to be set>                               | Find it in Fusionauth admin panel -> settings -> API keys -> the one called "back-end (local)"                              |
| FUSIONAUTH_TENANT                  | <none. needs to be set>                               | Find it in Fusionauth admin panel -> Tenants -> the one called "Local"                                                      |
| FUSIONAUTH_BACKEND_APPLICATION_ID  | <none. needs to be set>                               | Find it in Fusionauth admin panel -> Applications -> the one called "back-end (local)"                                      |
| FUSIONAUTH_ADMIN_APPLICATION_ID    | <none. needs to be set>                               | Find it in Fusionauth admin panel -> Applications -> the one called "admin-local"                                           |
| FUSIONAUTH_SFTP_APPLICATION_ID     | <none. needs to be set>                               | Find it in Fusionauth admin panel -> Applications -> the one called "sftp (local)"                                          |
| LEGACY_BACKEND_HOST_URL            | http://load_balancer:80/api                           |
| LEGACY_BACKEND_SHARED_SECRET       | none                                                  | Can be found in `back-end`'s library/base/constants/base.constants.php                                                      |
| MAILCHIMP_API_KEY                  | none                                                  | Can be found in `back-end`'s library/base/constants/base.constants.php                                                      |
| MAILCHIMP_TRANSACTIONAL_API_KEY    | none                                                  | Can be found in `back-end`'s library/base/constants/base.constants.php, where it is called `MANDRILL_API_KEY`               |
| MAILCHIMP_DATACENTER               | us12                                                  |
| MAILCHIMP_COMMUNITY_LIST_ID        | 2736f796db                                            | The default value corresponds to the `dev` list                                                                             |
| SENTRY_DSN                         | none                                                  | Can be found in Sentry under Projects > stela > Settings > Client Keys (DSN)                                                |
| DEV_NAME                           | none                                                  | Only set in local environments. Should be your given name. all lowercase. Used to create Sentry envs for developers         |
| AWS_REGION                         | us-west-2                                             |                                                                                                                             |
| AWS_ACCESS_KEY_ID                  | none                                                  | The same one you use in `devenv`                                                                                            |
| AWS_SECRET_ACCESS_KEY              | none                                                  | The same one you use in `devenv`                                                                                            |
| LOW_PRIORITY_TOPIC_ARN             | test                                                  | Doesn't need to be set to a real ARN unless your work touches it specifically                                               |
| EVENT_TOPIC_ARN                    | test                                                  | Doesn't need to be set to a real ARN unless your working with events specifically                                           |
| MIXPANEL_TOKEN                     | none                                                  | Found in Mixpanel at Settings > Project Settings > Project Token                                                            |
| ARCHIVEMATICA_BASE_URL             | none                                                  | It is the url of the EC2 instance on which archivematica is running                                                         |
| ARCHIVEMATICA_API_KEY              | none                                                  | Found in Bitwarden, not needed unless you're running the cleanup cron                                                       |
| CLOUDFRONT_URL                     | none                                                  | Can be found as `CDN_URL` in `back-end`'s library/base/constants/base.constants.php. Not required for API server            |
| CLOUDFRONT_KEY_PAIR_ID             | none                                                  | Can be found as `CLOUDFRONT_KEYPAIR` in `back-end`'s library/base/constants/base.constants.php. Not required for API server |
| CLOUDFRONT_PRIVATE_KEY             | none                                                  | Can be found in `back-end`'s library/static/certs/pk-APKAJP2D34UGZ6IG443Q.pem. Not required for API server                  |
| SITE_URL                           | local.permanent.org                                   |
| ARCHIVEMATICA_HOST_URL             | none                                                  | Only needed for the archivematica_triggerer lambda                                                                          |
| ARCHIVEMATICA_API_KEY              | none                                                  | Only needed for the archivematica_triggerer lambda                                                                          |
| ARCHIVEMATICA_ORIGINAL_LOCATION_ID | none                                                  | Only needed for the archivematica_triggerer lambda                                                                          |

## Linting

Run

```bash
npm run lint
```

## Testing

Stela tests require the devenv Docker environment to be running, as stela's test containers connect to devenv's database via a shared Docker network.

First, ensure devenv is running (from the `devenv` directory):

```bash
docker compose up -d
```

Then, from the stela directory, run tests with

```bash
npm run test
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

The API server should be run via devenv, which manages stela alongside the database and other services.

From the `devenv` directory, run:

```bash
docker compose up -d
```

If you've added or updated stela dependencies, rebuild the stela container:

```bash
docker compose up -d --build stela
```

**Running outside a container (not recommended):** If you have a local PostgreSQL instance and all environment variables configured, you can run:

```bash
npm run start -w @stela/api
```

However, running via devenv is preferred as it ensures all services are properly networked.

## Adding a New Service

This project contains an API server and some cron jobs, which run on AWS EKS, as well as some serverless functions that run on AWS Lambda.
All of these are configured and deployed through Terraform.
Creating new API servers in this project is unlikely, at least in the near future, but it is not uncommon to add a lambda or cron job.
To do so:

1. Create a new workspace to represent this service. It should have its own directory under `packages`.
2. Add your workspace to the workspaces array in the top-level package.json
3. Implement your service within the new workspace
4. Create a Dockerfile at `packages/<service_name>/Dockerfile` defining a docker image from which a container running your service can be built. Use existing Dockerfiles for lambdas (such as `packages/trigger_archivematica/Dockerfile`) or crons (such as `packages/thumbnail_refresh/Dockerfile`) as a guide.
5. In `terraform/test_cluster` add a terraform file defining your new cron job or lambda and its dependencies (crons don't tend to have dependencies, but lambdas will usually have at least an SQS queue that triggers the lambda). Use existing an existing cron or lambda definition as a guide. Be sure to define a data block corresponding to your service so Terraform can see what image your service is running on future deploys
6. If your service uses new environment variables, add them to `variables.tf`, and add the correct values for each environment in our [Terraform Cloud](https://app.terraform.io/app/PermanentOrg/workspaces). If you're adding a cron and any of your new environment variables are secrets, add them also to `secrets.tf`.
7. Add the name of your service's image to `required_dev_images` and `required_staging_images` in `locals.tf`. Also update the `current_kubernetes_images` and `current_lambda_images` definitions to include your service's image.
8. Repeat steps 5 and 6 in `terraform/prod_cluster`, but don't add data blocks (they are not necessary here)
9. In the Generate Image Tags Github workflow, add a step to generate an appropriate tag for the image
10. In the deploy Github workflow for each environment, add your service's image tag to the `env` of the deploy job. In dev and staging, add it also to the `image_overrides` variable passed to `terraform plan` and `terraform apply`. In prod, add it to the variables passed directly to `terraform plan` and `terraform apply`
11. Add a step to the unit tests Github workflow to run the tests for your new workspace (it would be ideal if we could just run `npm run test -ws`, but in the past this caused silent failures).

## Running Lambdas Locally

1. Build the lambda image

```bash
docker build --platform linux/amd64 -t <LAMBDA NAME>:test -f packages/<LAMBDA NAME>/Dockerfile .
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

4. Connect to the devenv docker network (devenv must be running)

```bash
docker network connect permanent_default <YOUR CONTAINER NAME>
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
