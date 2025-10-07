// @ts-nocheck
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

interface CreateUserBody {
  email?: string;
  full_name: string;
  username: string;
  role?: string;
  department?: string | null;
  rank?: string | null;
  service_number?: string | null;
  password?: string | null;
  requirePasswordChange?: boolean;
}

function genTempPassword(prefix = "QM"): string {
  const array = new Uint8Array(4);
  crypto.getRandomValues(array);
  const hex = Array.from(array).map((b) => b.toString(16).padStart(2, "0")).join("");
  return `${prefix}${hex.slice(0, 6)}`;
}

Deno.serve(async (req) => {
  try {
    const url = Deno.env.get("SUPABASE_URL");
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
    if (!url || !serviceKey || !anonKey) {
      return new Response(JSON.stringify({ success: false, message: "Missing Supabase env" }), { status: 500 });
    }

    // Admin client for privileged operations
    const admin = createClient(url, serviceKey);

    // Client to read caller info
    const authHeader = req.headers.get("Authorization") || "";
    const authed = createClient(url, anonKey, { global: { headers: { Authorization: authHeader } } });

    // Check caller
    const { data: userData } = await authed.auth.getUser();
    const callerId = userData?.user?.id;
    if (!callerId) return new Response(JSON.stringify({ success: false, message: "Unauthorized" }), { status: 401 });

    const { data: callerProfile } = await admin.from("users").select("role").eq("id", callerId).single();
    if (!callerProfile || callerProfile.role !== "super_admin") {
      return new Response(JSON.stringify({ success: false, message: "Forbidden" }), { status: 403 });
    }

    const body = (await req.json()) as CreateUserBody;
    if (!body.full_name || !body.username) {
      return new Response(JSON.stringify({ success: false, message: "Missing required fields" }), { status: 400 });
    }

    const role = body.role || "user";
    const email = body.email && body.email.trim() !== "" ? body.email.trim().toLowerCase() : `${body.username.toLowerCase()}@quartermaster.mil`;
    const password = body.password && body.password.trim() !== "" ? body.password : genTempPassword();
    const requireChange = body.requirePasswordChange !== false;

    // Create auth user
    const { data: created, error: createErr } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: body.full_name }
    });
    if (createErr || !created?.user) {
      return new Response(JSON.stringify({ success: false, message: createErr?.message || "Failed to create auth user" }), { status: 400 });
    }

    const authUser = created.user;

    // Upsert profile
    const { error: upsertErr } = await admin.from("users").upsert({
      id: authUser.id,
      email,
      full_name: body.full_name,
      username: body.username,
      role,
      department: body.department ?? null,
      rank: body.rank ?? null,
      service_number: body.service_number ?? null,
      is_active: true,
      password_change_required: requireChange,
      last_password_change: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      created_at: new Date().toISOString()
    }, { onConflict: "id" });

    if (upsertErr) {
      await admin.auth.admin.deleteUser(authUser.id);
      return new Response(JSON.stringify({ success: false, message: upsertErr.message || "Failed to save profile" }), { status: 400 });
    }

    return new Response(JSON.stringify({
      success: true,
      message: body.password ? "User created with custom password" : "User created with temporary password",
      user_id: authUser.id,
      email,
      full_name: body.full_name,
      username: body.username,
      role,
      temp_password: password
    }), { headers: { "Content-Type": "application/json" } });
  } catch (e) {
    return new Response(JSON.stringify({ success: false, message: String(e?.message || e) }), { status: 500 });
  }
});
