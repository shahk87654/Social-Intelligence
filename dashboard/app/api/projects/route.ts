import { NextResponse } from "next/server";
import { getCurrentUser, recordAuditEvent } from "@/lib/auth";
import { pool } from "@/lib/db";

export const dynamic = "force-dynamic";

async function current() {
  const user = await getCurrentUser();
  if (!user) throw new Error("UNAUTHORIZED");
  return user;
}

export async function GET() {
  try {
    const user = await current();
    const result = await pool.query(
      `SELECT id, name, description, keywords, platforms, facebook_targets, instagram_targets, created_at, updated_at
       FROM monitoring_projects WHERE organization_id = $1 ORDER BY updated_at DESC`,
      [user.organization_id]
    );
    return NextResponse.json({ projects: result.rows });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") return NextResponse.json({ error: "Sign in required." }, { status: 401 });
    console.error("Failed to load projects", error);
    return NextResponse.json({ error: "Unable to load monitoring projects." }, { status: 503 });
  }
}

export async function POST(req: Request) {
  try {
    const user = await current();
    const body = await req.json();
    const name = typeof body.name === "string" ? body.name.trim() : "";
    const description = typeof body.description === "string" ? body.description.trim() : null;
    const keywords = Array.isArray(body.keywords) ? body.keywords.filter((value: unknown): value is string => typeof value === "string" && value.trim().length > 0).map((value: string) => value.trim()) : [];
    const platforms = Array.isArray(body.platforms) ? body.platforms.filter((value: unknown): value is string => typeof value === "string") : [];
    const facebookTargets = Array.isArray(body.facebookTargets) ? body.facebookTargets.filter((value: unknown): value is string => typeof value === "string") : [];
    const instagramTargets = Array.isArray(body.instagramTargets) ? body.instagramTargets.filter((value: unknown): value is string => typeof value === "string") : [];
    if (!name || !keywords.length || !platforms.length) return NextResponse.json({ error: "Name, at least one keyword, and one platform are required." }, { status: 400 });
    const result = await pool.query(
      `INSERT INTO monitoring_projects (organization_id, name, description, keywords, platforms, facebook_targets, instagram_targets, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      [user.organization_id, name, description, keywords, platforms, facebookTargets, instagramTargets, user.id]
    );
    return NextResponse.json({ project: result.rows[0] }, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") return NextResponse.json({ error: "Sign in required." }, { status: 401 });
    console.error("Failed to create project", error);
    return NextResponse.json({ error: "Unable to create monitoring project." }, { status: 503 });
  }
}

export async function DELETE(req: Request) {
  try {
    const user = await current();
    if (user.role !== "admin") return NextResponse.json({ error: "Only workspace admins can delete projects." }, { status: 403 });
    const id = Number(new URL(req.url).searchParams.get("id"));
    if (!Number.isInteger(id)) return NextResponse.json({ error: "Valid project id is required." }, { status: 400 });
    const result = await pool.query("DELETE FROM monitoring_projects WHERE id = $1 AND organization_id = $2", [id, user.organization_id]);
    if (!result.rowCount) return NextResponse.json({ error: "Project not found." }, { status: 404 });
    await recordAuditEvent({ organizationId: user.organization_id, actorId: user.id, action: "project.deleted", resourceType: "project", resourceId: id });
    return NextResponse.json({ deleted: true });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") return NextResponse.json({ error: "Sign in required." }, { status: 401 });
    console.error("Failed to delete project", error);
    return NextResponse.json({ error: "Unable to delete monitoring project." }, { status: 503 });
  }
}
