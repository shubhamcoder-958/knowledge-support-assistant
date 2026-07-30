import { NextRequest, NextResponse } from "next/server";
import { readTickets, writeTickets, type TicketItem } from "../../../lib/ticket-store";

export async function GET() {
  const tickets = await readTickets();
  return NextResponse.json({ tickets });
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const tickets = await writeTickets(body.tickets as TicketItem[]);
  return NextResponse.json({ tickets });
}
