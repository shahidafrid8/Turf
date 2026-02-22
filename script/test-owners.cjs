require("dotenv").config();
const { createClient } = require("@supabase/supabase-js");

const sb = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { autoRefreshToken: false, persistSession: false } }
);

async function test() {
    console.log("SUPABASE_URL:", process.env.SUPABASE_URL ? "SET" : "MISSING");
    console.log("SUPABASE_SERVICE_ROLE_KEY:", process.env.SUPABASE_SERVICE_ROLE_KEY ? "SET (" + process.env.SUPABASE_SERVICE_ROLE_KEY.substring(0, 20) + "...)" : "MISSING");

    const { data, error } = await sb.auth.admin.listUsers({ perPage: 100 });
    if (error) {
        console.error("ERROR:", error.message);
        process.exit(1);
    }
    console.log("Total auth users:", data.users.length);

    const owners = data.users.filter(u => u.user_metadata?.role === "owner");
    console.log("Owners found:", owners.length);

    const pending = owners.filter(u => !u.user_metadata?.ownerStatus || u.user_metadata.ownerStatus === "pending");
    console.log("Pending owners:", pending.length);

    owners.forEach(u => {
        console.log(`  - ${u.email} | name: ${u.user_metadata?.full_name} | status: ${u.user_metadata?.ownerStatus || "pending"}`);
    });

    process.exit(0);
}

test().catch(e => { console.error(e); process.exit(1); });
