# API Documentation

- Path: `<host>/api/v2`

## Errors
Errors that can be foreseen, including any errors intended to be part of client control flow, will come with a JSON
response body, of the form
```
{
  "error": <error object>
}
```

For most errors, the error object will include at least a "message" field describing the error. Validation errors will
instead return a [Joi ValidationError object](https://joi.dev/api/?v=17.9.1#validationerror).

## Directives

### POST `/directive`

- Headers: Content-Type: application/json, Authorization: Bearer \<JWT from FusionAuth>
- Request Body

```
{
  archiveId: string,
  stewardEmail: string (email format),
  type: string (must be "transfer" presently),
  note: string (optional),
  trigger: {
    type: string (must be "admin" presently)
  }
}
```

- Response

```
{
  directiveId: string,
  archiveId: string,
  type: string,
  createdDt: string (date),
  updatedDt: string (date),
  trigger: {
    directiveTriggerId: string,
    directiveId: string,
    type: string,
    createdDt: string (date),
    updatedDt: string (date),
  },
  steward {
    email: string,
    name: string,
  }
  note: string,
  executionDt: string (date)
}
```

### POST `/directive/trigger/account/:accountId`

- Executes all admin-triggered directives for a given account
- Headers: Authorization: Bearer \<JWT from FusionAuth>
- Response:

```
[
  {
    archiveId: string,
    directiveId: string,
    outcome: string ("error" | "success"),
    errorMessage: string
  }
]
```

### PUT `/directive/:directiveId`

- Headers: Content-Type: application/json, Authorization: Bearer \<JWT from FusionAuth>
- Request Body

```
{
  stewardEmail: string (email format), (optional)
  type: string (must be "transfer" presently) (optional),
  note: string (optional),
  trigger: {
    type: string (must be "admin" presently) (optional)
  } (optional)
}
```

- Response

```
{
  directiveId: string,
  archiveId: string,
  type: string,
  createdDt: string (date),
  updatedDt: string (date),
  trigger: {
    directiveTriggerId: string,
    directiveId: string,
    type: string,
    createdDt: string (date),
    updatedDt: string (date),
  },
  steward {
    email: string,
    name: string,
  }
  note: string,
  executionDt: string (date)
}
```

### GET `/directive/archive/:archiveId`

- Headers: Authorization: Bearer \<JWT from FusionAuth>
- Response

```
[
  {
    directiveId: string,
    archiveId: string,
    type: string,
    createdDt: string (date),
    updatedDt: string (date),
    trigger: {
      directiveTriggerId: string,
      directiveId: string,
      type: string,
      createdDt: string (date),
      updatedDt: string (date),
    },
    steward: {
      email: string,
      name: string,
    },
    note: string,
    executionDt: string (date)
  }
]
```

## Legacy Contacts

### POST `/legacy-contact`

- Headers: Content-Type: application/json, Authorization: Bearer \<JWT from FusionAuth>
- Request Body

```
{
  email: string (email format),
  name: string
}
```

- Response

```
{
  legacyContactId: string,
  accountId: string,
  name: string,
  email: string,
  createdDt: string (date),
  updatedDt: string (date),
}
```

### GET `/legacy-contact`

- Headers Authorization: Bearer \<JWT from FusionAuth>
- Response

```
[
  {
    legacyContactId: string,
    accountId: string,
    name: string,
    email: string,
    createdDt: string (date),
    updatedDt: string (date),
  }
]
```

### PUT `/legacyContact/:legacyContactId`

- Headers: Content-Type: application/json, Authorization: Bearer \<JWT from FusionAuth>
- Request Body

```
{
  email: string (email format) (optional),
  name: string (optional)
}
```

- Response

```
{
  legacyContactId: string,
  accountId: string,
  name: string,
  email: string,
  createdDt: string (date),
  updatedDt: string (date),
}
```
