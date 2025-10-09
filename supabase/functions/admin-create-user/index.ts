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

// Map display names to database enum values
function normalizeRole(role?: string): string {
  if (!role) return "user";

  const roleLower = role.toLowerCase().trim();

  // Handle display names
  if (roleLower.includes("semi") || roleLower.includes("requester")) {
    return "semi_user";
  }
  if (roleLower.includes("super") || roleLower.includes("superadmin")) {
    return "super_admin";
  }
  if (roleLower.includes("admin")) {
    return "admin";
  }

  // Handle database enum values directly
  if (["semi_user", "user", "admin", "super_admin"].includes(roleLower)) {
    return roleLower;
  }

  // Default to user
  return "user";
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
  try {
    const url = Deno.env.get("SUPABASE_URL");
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY");

    console.log("Environment check:", {
      hasUrl: !!url,
      hasServiceKey: !!serviceKey,
      hasAnonKey: !!anonKey,
      serviceKeyPrefix: serviceKey?.substring(0, 20) + "...",
      anonKeyPrefix: anonKey?.substring(0, 20) + "..."
    });

    if (!url || !serviceKey || !anonKey) {
      return new Response(JSON.stringify({
        success: false,
        message: "Missing Supabase env",
        debug: {
          hasUrl: !!url,
          hasServiceKey: !!serviceKey,
          hasAnonKey: !!anonKey
        }
      }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Admin client for privileged operations
    const admin = createClient(url, serviceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    // Client to read caller info
    const authHeader = req.headers.get("Authorization") || "";
    const authed = createClient(url, anonKey, { global: { headers: { Authorization: authHeader } } });

    // Check caller
    const { data: userData, error: userError } = await authed.auth.getUser();
    const callerId = userData?.user?.id;

    if (!callerId) {
      console.error("No caller ID found. User error:", userError);
      return new Response(JSON.stringify({
        success: false,
        message: "Unauthorized - No user session found",
        debug: userError?.message
      }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const { data: callerProfile, error: profileError } = await admin.from("users").select("role").eq("id", callerId).single();

    console.log("Caller ID:", callerId);
    console.log("Caller Profile:", callerProfile);
    console.log("Profile Error:", profileError);

    if (!callerProfile || callerProfile.role !== "super_admin") {
      return new Response(JSON.stringify({
        success: false,
        message: `Forbidden - Role: ${callerProfile?.role || 'not found'}`,
        debug: {
          callerId,
          foundProfile: !!callerProfile,
          role: callerProfile?.role,
          profileError: profileError?.message
        }
      }), { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const body = (await req.json()) as CreateUserBody;
    if (!body.full_name || !body.username) {
      return new Response(JSON.stringify({ success: false, message: "Missing required fields" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const role = normalizeRole(body.role);
    console.log("Role mapping:", { received: body.role, normalized: role });

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
      return new Response(JSON.stringify({ success: false, message: createErr?.message || "Failed to create auth user" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
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
      password_hash: '',  // Empty since auth.users handles authentication
      is_active: true,
      password_change_required: requireChange,
      last_password_change: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      created_at: new Date().toISOString()
    }, { onConflict: "id" });

    if (upsertErr) {
      await admin.auth.admin.deleteUser(authUser.id);
      return new Response(JSON.stringify({ success: false, message: upsertErr.message || "Failed to save profile" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
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
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    return new Response(JSON.stringify({ success: false, message: String(e?.message || e) }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
