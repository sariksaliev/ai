# Axiom OS — Interactive MVP

Autonomous Business Execution System concept built as a dependency-free interactive web prototype.

## Run

Run `node server.js`, then open `http://localhost:3000`.

## Included flows

- Executive business dashboard with health metrics and AI activity.
- Multi-agent investigation into declining EU pipeline.
- Human approval of the recovery plan, which creates an execution item.
- AI team, execution board, Business Graph, reports, knowledge and integrations views.

The MVP now includes a zero-dependency Node.js API and persistent workspace state in `data.json`. Data is simulated; external SaaS integrations are represented by an API-ready agent model.

## Demo sign-in

- Email: `sam@nimbus.demo`
- Password: `axiom-demo`

HubSpot and Slack connections are simulated in this local MVP. Their granted scopes and all approvals/actions are captured in the Audit Trail.

## Enabling OAuth

Set `HUBSPOT_CLIENT_ID` and/or `SLACK_CLIENT_ID` before starting the server. The OAuth-start endpoint then returns the provider authorization URL. Callback token exchange is deliberately not enabled until the corresponding client secrets, redirect URLs and encrypted token vault are configured.
