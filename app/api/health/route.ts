export function GET() {
  return Response.json({
    service: "recharza-platform",
    status: "ok",
    timestamp: new Date().toISOString(),
  });
}
