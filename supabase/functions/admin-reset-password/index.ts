// @ts-nocheck
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

interface ResetBody {
  user_id: string;
  new_password?: string | null;
}

function genTempPassword(prefix = "QM"): string {
  const array = new Uint8Array(4);
  crypto.getRandomValues(array);
  const hex = Array.from(array).map((b) => b.toString(16).padStart(2, "0")).join("");
  return `${prefix}${hex.slice(0, 6)}`;
}

Deno.serve(async (req) => {
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
      return new Response(JSON.stringify({ success: false, message: "Missing Supabase env" }), { status: 500 });
    }

    const admin = createClient(url, serviceKey);

    // Authenticated caller check (super_admin only)
    const authHeader = req.headers.get("Authorization") || "";
    const authed = createClient(url, anonKey, { global: { headers: { Authorization: authHeader } } });
    const { data: u } = await authed.auth.getUser();
    const callerId = u?.user?.id;
    if (!callerId) return new Response(JSON.stringify({ success: false, message: "Unauthorized" }), { status: 401 });

    const { data: callerProfile } = await admin.from("users").select("role").eq("id", callerId).single();
    if (!callerProfile || callerProfile.role !== "super_admin") {
      return new Response(JSON.stringify({ success: false, message: "Forbidden" }), { status: 403 });
    }

    const body = (await req.json()) as ResetBody;
    if (!body.user_id) {
      return new Response(JSON.stringify({ success: false, message: "user_id is required" }), { status: 400 });
    }

    const password = body.new_password && body.new_password.trim() !== "" ? body.new_password : genTempPassword();

    // Update Auth password
    const { error: updErr } = await admin.auth.admin.updateUserById(body.user_id, { password });
    if (updErr) {
      return new Response(JSON.stringify({ success: false, message: updErr.message || "Failed to update password" }), { status: 400 });
    }

    // Mark require change in profile for UX (no password hashes here)
    const { error: profErr } = await admin
      .from("users")
      .update({ password_change_required: true, updated_at: new Date().toISOString() })
      .eq("id", body.user_id);

    if (profErr) {
      // Password already updated in Auth; surface warning
      return new Response(JSON.stringify({ success: true, temp_password: password, message: `Password updated in Auth, but profile flag update failed: ${profErr.message}` }), { status: 200 });
    }

    return new Response(JSON.stringify({ success: true, temp_password: password, message: "Password reset successfully" }), { status: 200, headers: { "Content-Type": "application/json" } });
  } catch (e) {
    return new Response(JSON.stringify({ success: false, message: String(e?.message || e) }), { status: 500 });
  }
});
