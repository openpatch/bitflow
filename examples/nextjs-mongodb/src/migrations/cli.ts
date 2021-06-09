require("dotenv").config({ path: ".env.local" });
import migrations from "./index";

migrations.up();
