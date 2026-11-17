// Entry point: starts the Express app from app.ts on PORT (default 3000).

import { app } from "./app";

const PORT = Number(process.env.PORT) || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));