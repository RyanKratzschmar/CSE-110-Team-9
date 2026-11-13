// Entry point: starts the Express app from app.ts on PORT (default 3000).
import { app } from "./app";

const port = Number(process.env.PORT ?? 3000);

app.listen(port, () => {
    console.log('Backend running at http://localhost:${port}');
});
