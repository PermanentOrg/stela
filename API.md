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

## Admin

These endpoints are all authenticated with admin authentication tokens, generated according to step 2 in this
[documentation](https://permanent.atlassian.net/wiki/spaces/EN/pages/2072576001/Trigger+Admin+Directives)

### POST `/admin/folder/recalculate_thumbnails`

Queues thumbnail generation tasks for all non-root folders created between `beginTimestamp` and `endTimestamp`.

- Headers: Authorization: Bearer \<JWT from FusionAuth>

- Request

```
{
    beginTimestamp: string (date, iso format)
    endTimestamp: string (date, iso format)
}
```

- Response

```
{
  messagesSent: int,
  failedFolders: [string (folder ID)]
}
```

## Directives

### POST `/directive`

- Headers: Content-Type: application/json, Authorization: Bearer \<JWT from FusionAuth>
- Request Body

```
{
  archiveId: string,
  stewardEmail: string (email format),
  type: string (must be "transfer" presently), note: string (optional), trigger: {
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

- Headers: Authorization: Bearer \<JWT from FusionAuth>
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

## Accounts

### PUT `/account/tags`

- Headers: Authorization: Bearer \<JWT from FusionAuth>
- Request Body

```
{
  addTags: [string]
  removeTags: [string]
}
```

- Response

```
{} (empty response with 200 code indicates success)
```

### GET `/account/signup`

- Headers: Authorization: Bearer \<JWT from FusionAuth>

- Response

```
{
  token: string
}
```

## Archives

### GET `/archive/:archiveId/tags/public`

- Response

```
[
  {
    tagId: string,
    name: string,
    archiveId: string,
    status: string,
    type: string,
    createdDt: string (date),
    updatedDt: string (date)
  }
]
```

- Note: If the archive doesn't exist, this will return an empty array

### GET `/archive/:archiveId/payer-account-storage

- Headers: Authorization: Bearer \<JWT from FusionAuth>

- Response

```
{
  accountSpaceId: string,
  accountId: string,
  spaceLeft: string,
  spaceTotal: string,
  filesLeft: string,
  filesTotal: string,
  status: string,
  type: string,
  createdDt: string (date),
  updatedDt: string (date)
}
```

- Note: This will return a 404 error if the archive has no payer account, or if the caller doesn't have access to that
  archive

### POST `/archive/:archiveId/make-featured`

- Headers: Authorization: Bearer \<Admin JWT from FusionAuth>
- Response: 200 if successful, 400 if archive is already featured, doesn't exist, or isn't public

### DELETE `/archive/:archiveId/unfeature

- Headers: Authorization: Bearer \<Admin JWT from FusionAuth>
- Response: 200 if successful

### GET `/archive/featured`

- Response

```
{
  archiveId: string,
  name: string,
  type: string,
  archiveNbr: string,
  profileImage: string (URL),
  bannerImage: string (URL)
}
```

## Billing

### POST `/billing/gift`

- Headers: Authorization: Bearer \<JWT from FusionAuth>
- Request Body

```
{
  storageAmount: int (expressed in GB, given to each recipient)
  recipientEmails: [string] (email format, list must be non-empty)
  note: string
}
```

- Response

```
{
  storageGifted: int (expressed in GB) // total amount of storage given away
  giftDelivered: [string] // emails to which the gift has been successfully delivered
  // emails which don't have Permanent accounts yet, gift will be delivered when the accept the invite
  invitationSent: [string]
  // emails to which no gift could be made because they have no account and have already been invited
  alreadyInvited: [string]
}
```
