# Grafana-Style Request Drill-Down Stub

A lightweight static page that mimics a Grafana request drill‑down view. It includes:

- A Grafana‑like layout (sidebar, top bars, panels).
- Variables for `service` and `requestID`.
- Automatic `requestID` synchronization across tables and logs.
- Grafana‑style `from`/`to` time range parsing (relative, epoch, ISO).

## Usage

Open `index.html` in a browser.

The `requestID` input is populated from the URL if present, otherwise a random ID is generated. All occurrences of `requestId` in the tables/logs update when you edit the input.

## URL Examples

- Request ID from query:
  - `?requestId=abcd1234`
- Request ID from hash:
  - `#requestId=abcd1234`
- Time range (Grafana‑style):
  - `?from=now-6h&to=now`
  - `?from=now-1d/d&to=now`
  - `?from=1700000000000&to=1700003600000`

## Notes

- This is a static stub (no real data backend).
- `from`/`to` support: `now`, relative math (`now-6h`, `now-1M`), rounding (`/h`, `/d`), epoch seconds/milliseconds, and ISO timestamps.
