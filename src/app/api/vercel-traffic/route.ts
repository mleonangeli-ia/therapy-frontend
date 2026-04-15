import { NextResponse } from "next/server";

const PROJECT_ID = "prj_hzigtrBoUfLXW7o4cpNpfqvl6DCF";
const TEAM_ID = "team_Y14VUQMDaSsYaqhTw7ej3O9l";

export async function GET() {
  const token = process.env.VERCEL_API_TOKEN;
  if (!token) {
    return NextResponse.json({ error: "No analytics token configured" }, { status: 503 });
  }

  const to = new Date();
  const from = new Date(to);
  from.setDate(from.getDate() - 29); // last 30 days

  const params = new URLSearchParams({
    projectId: PROJECT_ID,
    teamId: TEAM_ID,
    from: from.toISOString(),
    to: to.toISOString(),
    granularity: "day",
  });

  const res = await fetch(
    `https://vercel.com/api/web/insights/timeseries?${params}`,
    { headers: { Authorization: `Bearer ${token}` }, next: { revalidate: 300 } }
  );

  if (!res.ok) {
    return NextResponse.json({ error: "Analytics unavailable" }, { status: 502 });
  }

  const data = await res.json();
  return NextResponse.json(data);
}
