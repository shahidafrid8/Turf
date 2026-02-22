import { config } from "dotenv";
config();

import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

async function seedAdmin() {
    const email = "shaikmahammadshahidafrid@gmail.com";
    const password = "Ineedhighjob8$";

    console.log("Creating admin user in Supabase Auth...");

    // Sign up the admin user
    const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
            data: {
                full_name: "Admin",
                role: "admin",
                ownerStatus: "none",
            },
        },
    });

    if (error) {
        if (error.message.includes("already registered") || error.message.includes("already been registered")) {
            console.log("✅ Admin user already exists in Supabase Auth — skipping creation.");
            console.log("   Logging in to verify...");

            const { data: loginData, error: loginErr } = await supabase.auth.signInWithPassword({ email, password });
            if (loginErr) {
                console.error("❌ Login failed:", loginErr.message);
                process.exit(1);
            }
            console.log("✅ Admin login successful! User ID:", loginData.user?.id);

            // Ensure metadata is set
            const { error: updateErr } = await supabase.auth.updateUser({
                data: { full_name: "Admin", role: "admin", ownerStatus: "none" },
            });
            if (updateErr) console.error("⚠️  Metadata update failed:", updateErr.message);
            else console.log("✅ Admin user metadata updated (role=admin)");
        } else {
            console.error("❌ Signup error:", error.message);
            process.exit(1);
        }
    } else {
        console.log("✅ Admin user created successfully!");
        console.log("   User ID:", data.user?.id);
        console.log("   Email:", email);
        console.log("   Role: admin (hardcoded in AuthContext + metadata)");

        if (data.user?.identities?.length === 0) {
            console.log("⚠️  User existed but was unconfirmed. Please check your email to confirm.");
        }
    }

    console.log("\n📋 Admin email is already in ADMIN_EMAILS array in AuthContext.tsx");
    console.log("   → When this user logs in, they automatically get the admin role.");
    console.log("\n✅ Done!");
    process.exit(0);
}

seedAdmin();
