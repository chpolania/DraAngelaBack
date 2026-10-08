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

## Members

- Andrés Felipe Wilches Torres
