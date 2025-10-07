// @ts-nocheck
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

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
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
  try {
    const url =
      Deno.env.get("PROJECT_URL") ??
      Deno.env.get("SUPABASE_URL");
    const serviceKey =
      Deno.env.get("SERVICE_ROLE_KEY") ??
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const anonKey =
      Deno.env.get("ANON_KEY") ??
      Deno.env.get("SUPABASE_ANON_KEY");
    if (!url || !serviceKey || !anonKey) {
      return new Response(JSON.stringify({ success: false, message: "Missing Supabase env" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Admin client for privileged operations
    const admin = createClient(url, serviceKey);

    // Client to read caller info
    const authHeader = req.headers.get("Authorization") || "";
    const authed = createClient(url, anonKey, { global: { headers: { Authorization: authHeader } } });

    // Check caller
    const { data: userData } = await authed.auth.getUser();
    const callerId = userData?.user?.id;
    if (!callerId) return new Response(JSON.stringify({ success: false, message: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const { data: callerProfile } = await admin.from("users").select("role").eq("id", callerId).single();
    if (!callerProfile || callerProfile.role !== "super_admin") {
      return new Response(JSON.stringify({ success: false, message: "Forbidden" }), { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const body = (await req.json()) as CreateUserBody;
    if (!body.full_name || !body.username) {
      return new Response(JSON.stringify({ success: false, message: "Missing required fields" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const role = body.role || "user";
    const email = body.email && body.email.trim() !== "" ? body.email.trim().toLowerCase() : `${body.username.toLowerCase()}@quartermaster.mil`;
    const password = (body.password || "").trim();
    if (!password) {
      return new Response(JSON.stringify({ success: false, message: "Password is required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Pre-validate duplicates in public.users (username/email/service_number)
    {
      const [{ data: u1 }, { data: u2 }, { data: u3 }] = await Promise.all([
        admin.from("users").select("id").eq("username", body.username).limit(1),
        admin.from("users").select("id").eq("email", email).limit(1),
        body.service_number ? admin.from("users").select("id").eq("service_number", body.service_number).limit(1) : Promise.resolve({ data: null }),
      ]);
      if (u1 && (u1 as any[]).length > 0) {
        return new Response(JSON.stringify({ success: false, message: "Username already in use" }), { status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      if (u2 && (u2 as any[]).length > 0) {
        return new Response(JSON.stringify({ success: false, message: "Email already in use" }), { status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      if (u3 && (u3 as any[]).length > 0) {
        return new Response(JSON.stringify({ success: false, message: "Service number already in use" }), { status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
    }

    // Create auth user
    const { data: created, error: createErr } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: body.full_name }
    });
    if (createErr || !created?.user) {
      const msg = createErr?.message || "Failed to create auth user";
      const status = /already registered|already exists|duplicate/i.test(msg) ? 409 : 400;
      return new Response(JSON.stringify({ success: false, message: msg }), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const authUser = created.user;

    // Upsert profile (no password flags; simple model)
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
      updated_at: new Date().toISOString(),
      created_at: new Date().toISOString()
    }, { onConflict: "id" });

    if (upsertErr) {
      return new Response(JSON.stringify({ success: false, message: upsertErr.message || "Failed to save profile" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    return new Response(JSON.stringify({
      success: true,
      message: "User created",
      user_id: authUser.id,
      email,
      full_name: body.full_name,
      username: body.username,
      role,
    }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    return new Response(JSON.stringify({ success: false, message: String(e?.message || e) }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
