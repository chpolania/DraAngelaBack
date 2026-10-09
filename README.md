# api-nodejs-mngr-rest

## Software Architecture

The `api-nodejs-mngr-rest` is designed leveraging the principles of Hexagonal Architecture to ensure a clean separation of concerns, making it more adaptable to changes and easier to test. This architecture divides the application into several layers, each with its own responsibility.

- **Adapters Layer**: Located within the `adapters` directory, this layer contains the controllers and presentation logic. It acts as the bridge between the external world and our application, converting external requests into a format that the application can understand.

- **Application Layer**: This is the heart of our business logic. Here, we define the services that execute operations related to our business rules. It's crafted to be independent of any external interfaces, ensuring that core functionality can evolve independently of external changes.

- **Infrastructure / Server Layer**: Found in the `infrastructure` directory, this layer manages the technical details and configurations necessary for running our application. It includes server configurations and external integrations, abstracting the complexities of external communications from the core logic of the application.

- **Domain Layer**: The domain layer hosts our data interfaces and repositories. Located in the `domain` directory, it defines the business entities and the contracts for data access, ensuring that the application can interact with data sources in a consistent manner.

- **Bin Layer**: The initialization of the server is handled in the `bin` layer. It's responsible for bootstrapping the application, setting up the necessary configurations for the application to run.

For integration and continuous deployment, the API utilizes a `config.ts` file for environment variables, facilitating seamless integration with CI/CD pipelines. This approach not only enhances the maintainability and scalability of the application but also streamlines the deployment process, ensuring that the application can be easily integrated into various environments with minimal configuration changes.

In summary, the `api-nodejs-mngr-rest` is structured to promote flexibility, maintainability, and scalability, adhering to best practices in software architecture. It's an ideal starting point for building Node.js APIs that require a robust structure for long-term evolution and integration.

## Repository Purpose

The primary aim of this repository is to maintain the Node.js API Manager template. This template is designed to provide a solid foundation for building Node.js APIs, incorporating principles of Hexagonal Architecture for clean separation of concerns and adaptability to change.

## Installation

Follow these steps to get the application up and running on your local machine (bash):

1. **Clone the Repository**: Start by cloning this repository to your local environment. Use the command: `git clone <repository-url>`
2. **Install Dependencies**: Navigate to the root folder of the project and install the necessary dependencies by running: `npm install`
3. **Run the Application**: For Linux systems, you can start the application by executing: `npm run dev`

For further information, look at the `package.json` file at the root of the project.

## Making API Requests

The API provides endpoints for tax calculation and Google Calendar event creation. To calculate tax, use:

```cURL
curl --location 'http://localhost:9080/v1/product/tax' \
--header 'X-RqUID: 12345' \
--header 'X-Name: API node js challenge 2' \
--header 'Content-Type: application/json' \
--data '{
    "id": "string",
    "amount": 100000,
    "idClient": "string",
    "email": "string"
}'
```

## Creating a Google Calendar event

The unauthenticated `POST /v1/product/calendar/events` endpoint creates an event with the Google Calendar API. Enable the Google Calendar API in the Google Cloud project, then share the target calendar with the service account and grant it permission to make changes to events.

The unauthenticated `GET /v1/product/calendar/availability` endpoint takes a `date` query parameter in `dd/MM/yyyy` format and returns free one-hour slots between 08:00 and 18:00 in `America/Bogota`. Existing non-cancelled, non-transparent events are excluded, including recurring event instances. For example:

```bash
curl --get 'http://localhost:9080/v1/product/calendar/availability' \
  --data-urlencode 'date=09/10/2026'
```

The API allows public cross-origin requests and answers browser `OPTIONS` preflight requests. It does not allow credentialed browser requests; do not set `credentials: 'include'` or `withCredentials: true`.

The response contains the requested date, time zone, and available slot labels such as `8am - 9am`. The service account needs access to read events in the target calendar.

Configure these environment variables in the backend runtime:

- `GOOGLE_CALENDAR_ID`: the target calendar ID, usually the calendar owner's email address for a calendar shared with the service account. Use `primary` only when the service account itself has a primary calendar.
- `GOOGLE_SERVICE_ACCOUNT_EMAIL`: the service account email address.
- `GOOGLE_PRIVATE_KEY`: the service account private key. If stored with literal `\n` characters, the backend converts them to line breaks.

The service account creates events without Calendar attendees or invitation emails. Patient information can be sent using `patientName`, `patientEmail`, `patientPhone`, `serviceTitle`, and `notes`; the backend appends these fields to the event description. The legacy `attendees` array is also accepted, but its email addresses are copied to the description only and are not invited.

Example request:

```bash
curl --location 'http://localhost:9080/v1/product/calendar/events' \
  --header 'Content-Type: application/json' \
  --data '{
    "summary": "Consulta médica",
    "description": "Control de seguimiento",
    "location": "Consultorio",
    "patientName": "Nombre del paciente",
    "patientEmail": "paciente@example.com",
    "patientPhone": "+57 300 000 0000",
    "serviceTitle": "Consulta general",
    "notes": "Primera valoración",
    "start": {
      "dateTime": "2026-10-09T10:00:00-05:00",
      "timeZone": "America/Bogota"
    },
    "end": {
      "dateTime": "2026-10-09T10:30:00-05:00",
      "timeZone": "America/Bogota"
    }
  }'
```

`summary`, `start.dateTime`, `start.timeZone`, `end.dateTime`, and `end.timeZone` are required. `description`, `location`, and patient detail fields are optional. The response returns the created event ID and its Google Calendar link. Since attendees are not invited, send any patient confirmation separately if needed.

This endpoint intentionally has no caller authentication. Restrict network access or apply rate limiting at the API gateway before exposing it publicly.

If Google responds that the calendar was not found or accessible, verify that `GOOGLE_CALENDAR_ID` is the target calendar's actual ID and that the calendar is shared with `GOOGLE_SERVICE_ACCOUNT_EMAIL` with permission to make changes to events. Enable the Google Calendar API for the service account's Google Cloud project, then restart the API after changing `.env`.

## Updating landing-page content

The API exposes a public, read-only `GET /v1/product/landing-page` endpoint for the landing-page content. It returns records with `active = 1` for `es-CO`; select another language with `?language=en-US`. The response contains only sections and lists that have matching rows in MySQL; it does not fill missing content with defaults. Parameter values are grouped under `parameters` by `section` and `parameter_key`; `json`, `number`, and `boolean` value types are parsed into JSON values. Services and testimonials are ordered by `display_order`.

The API also exposes a protected `GET` endpoint to retrieve all records from `landing_page_parameter`, including inactive rows:

- `/v1/product/landing-page/parameters`
- `/v1/product/landing-page/services` retrieves all `landing_page_service` records, including inactive rows.
- `/v1/product/landing-page/testimonials` retrieves all `landing_page_testimonial` records, including inactive rows.

These endpoints require the access token returned by login using the Bearer authorization scheme. The parameters response is an array of records containing `id`, `section`, `parameter_key`, `parameter_value`, `value_type`, `language`, and `active`. The services response includes `id`, `title`, `badge`, `short_description`, `full_description`, `duration`, `price`, `icon`, `benefits`, `language`, `active`, and `display_order`. Testimonials include `id`, `name`, `rating`, `comment`, `testimonial_date`, `service`, `verified`, `language`, `active`, and `display_order`.

Visitors can submit a review without authentication using `POST /v1/product/landing-page/testimonials`. Send `name`, `rating` (integer from 1 to 5), and `comment`; `service` and `language` are optional (`es-CO` by default). New submissions are stored inactive and unverified for moderation, with the submission date set by the API:

```bash
curl --request POST 'http://localhost:9080/v1/product/landing-page/testimonials' \
  --header 'Content-Type: application/json' \
  --data '{"name":"Ana","rating":5,"comment":"Excelente atención","service":"Consulta","language":"es-CO"}'
```

The API responds with `201` and the new record ID. An administrator must activate and verify the review before it appears publicly.

Three protected `PATCH` endpoints update existing records only:

- `/v1/product/landing-page/parameters/:id`
- `/v1/product/landing-page/services/:id`
- `/v1/product/landing-page/testimonials/:id`

All three require an access token in the `Authorization: Bearer <token>` header. Obtain the token through `POST /v1/product/auth/login` using an active `app_user` username and password. The access token is signed using `JWT_SECRET` and expires after one hour. Set `JWT_SECRET` to a random secret of at least 32 bytes and configure `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, and `DB_PASSWORD` for MySQL. For Hostinger, use the database host and credentials shown in its control panel; do not assume the host is `localhost` if the database is hosted remotely. Keep these values in the hosting provider's environment configuration and never commit them.

Login example:

```bash
curl --request POST 'http://localhost:9080/v1/product/auth/login' \
  --header 'Content-Type: application/json' \
  --data '{"username":"your-username","password":"your-password"}'
```

The response includes `access_token`, `token_type` (`Bearer`), and `expires_in` (`3600` seconds). Use the returned access token on the landing-page update endpoints.

For accounts using this login implementation, store `password_salt` as Base64 for at least 16 cryptographically random bytes, and `password_hash` as the 64-character hexadecimal Argon2id raw digest. The Argon2id parameters are 64 MiB memory, 3 iterations, 1 lane, and a 32-byte digest. Passwords are verified against these separate values; they are never decrypted.

Users can be provisioned through the protected `POST /v1/product/auth/users` endpoint. Set `USER_PROVISIONING_TOKEN` to a separate random secret of at least 32 bytes in the backend environment. Supply it in the `X-User-Provisioning-Token` header; this secret is distinct from `JWT_SECRET` and user access tokens.

```bash
curl --request POST 'http://localhost:9080/v1/product/auth/users' \
  --header "X-User-Provisioning-Token: ${USER_PROVISIONING_TOKEN}" \
  --header 'Content-Type: application/json' \
  --data '{"username":"new-user","password":"use-a-strong-password"}'
```

The service creates a unique salt and Argon2id hash using the same parameters as login, then inserts the record into `app_user`. `active` defaults to `true` and can be set to `false` to provision a disabled user. Successful creation returns `201`; duplicate usernames return `409`. Requests are rejected if the provisioning secret is missing or incorrect.

The updateable fields are `section`, `parameter_key`, `parameter_value`, `value_type`, `language`, and `active` for parameters; `title`, `badge`, `short_description`, `full_description`, `duration`, `price`, `icon`, `benefits`, `active`, `display_order`, and `language` for services; and `name`, `rating`, `comment`, `testimonial_date`, `service`, `verified`, `active`, `display_order`, and `language` for testimonials. Each request body must include at least one of that table's fields, for example:

```bash
curl --request PATCH 'http://localhost:9080/v1/product/landing-page/services/1' \
  --header "Authorization: Bearer ${ACCESS_TOKEN}" \
  --header 'Content-Type: application/json' \
  --data '{"title":"Consulta especializada","price":"150000","active":true}'
```

`id`, `created_at`, and `updated_at` cannot be supplied; `updated_at` is maintained by the API. The endpoint returns `404` if the ID does not exist, and rejects unknown or invalid fields. These routes do not create or delete records and do not run schema changes; add the records and tables separately before using them.

## Members

- Andrés Felipe Wilches Torres
