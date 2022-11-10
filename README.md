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

| Variable     | Default                                                     | Notes                                  |
| ------------ | ----------------------------------------------------------- | -------------------------------------- |
| DATABASE_URL | postgres://postgres:permanent@localhost:5432/test_permanent | Run tests to generate default database |

## Testing

Run tests with

```bash
npm run test
```

Note that the database tests run against is dropped and recreated at the beginning of each test run.

## Running Locally

Run the project locally with

```bash
npm run start
```
