import { NextRequest, NextResponse } from "next/server";

export async function GET(
    request: NextRequest,
    { params }: { params: { shortCode: string } }
) {
    const { shortCode } = params;

    // Filter out asset requests or dotfiles
    if (!shortCode || shortCode.includes(".")) {
        return new NextResponse("Not Found", { status: 404 });
    }

    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";
    // Strip trailing /api/v1 or /api/v1/
    const backendBase = apiUrl.replace(/\/api\/v1\/?$/, "").replace(/\/+$/, "");

    // Redirect to backend endpoint so the backend records the visit & increments access_count
    return NextResponse.redirect(`${backendBase}/${shortCode}`, 307);
}
