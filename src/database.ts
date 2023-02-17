import * as path from "path";
import { TinyPg } from "tinypg";

export const db = new TinyPg({
  connection_string: process.env["DATABASE_URL"] ?? "",
  root_dir: [path.resolve(__dirname, ".")],
});
