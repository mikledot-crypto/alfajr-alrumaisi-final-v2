import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { z } from "zod";

async function assertAdmin(userId: string) {
  const { data } = await supabaseAdmin
    .from("user_roles")
    .select("role")
    .eq("user_id", userId)
    .eq("role", "admin")
    .maybeSingle();
  if (!data) throw new Error("غير مصرّح");
}

export const listUsers = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context.userId);
    const { data, error } = await supabaseAdmin.auth.admin.listUsers({ perPage: 200 });
    if (error) throw new Error(error.message);
    const ids = data.users.map((u) => u.id);
    const { data: roles } = await supabaseAdmin.from("user_roles").select("user_id,role").in("user_id", ids);
    return data.users.map((u) => ({
      id: u.id,
      email: u.email ?? "",
      created_at: u.created_at,
      roles: (roles ?? []).filter((r) => r.user_id === u.id).map((r) => r.role as "admin" | "editor"),
    }));
  });

export const createUser = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { email: string; password: string; role: "admin" | "editor" | "none" }) =>
    z.object({
      email: z.string().email().max(255),
      password: z.string().min(6).max(128),
      role: z.enum(["admin", "editor", "none"]),
    }).parse(d),
  )
  .handler(async ({ context, data }) => {
    await assertAdmin(context.userId);
    const { data: created, error } = await supabaseAdmin.auth.admin.createUser({
      email: data.email,
      password: data.password,
      email_confirm: true,
    });
    if (error) throw new Error(error.message);
    if (data.role !== "none" && created.user) {
      await supabaseAdmin.from("user_roles").insert({ user_id: created.user.id, role: data.role });
    }
    return { ok: true };
  });

export const setUserRole = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { userId: string; role: "admin" | "editor" | "none" }) =>
    z.object({ userId: z.string().uuid(), role: z.enum(["admin", "editor", "none"]) }).parse(d),
  )
  .handler(async ({ context, data }) => {
    await assertAdmin(context.userId);
    await supabaseAdmin.from("user_roles").delete().eq("user_id", data.userId);
    if (data.role !== "none") {
      await supabaseAdmin.from("user_roles").insert({ user_id: data.userId, role: data.role });
    }
    return { ok: true };
  });

export const deleteUser = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { userId: string }) => z.object({ userId: z.string().uuid() }).parse(d))
  .handler(async ({ context, data }) => {
    await assertAdmin(context.userId);
    if (data.userId === context.userId) throw new Error("لا يمكنك حذف حسابك");
    const { error } = await supabaseAdmin.auth.admin.deleteUser(data.userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
