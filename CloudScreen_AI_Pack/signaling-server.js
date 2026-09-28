const http = require("http");
const WebSocket = require("ws");

const PORT = 3000;
const clients = new Map();

const server = http.createServer((req, res) => {
    res.writeHead(200, { "Content-Type": "text/plain" });
    res.end("CloudScreen Signaling Server OK\n");
});

const wss = new WebSocket.Server({ server });

wss.on("connection", (ws) => {
    console.log("Client connected");

    ws.on("message", (raw) => {
        let message;

        try {
            message = JSON.parse(raw.toString());
        } catch {
            console.log("Invalid JSON");
            return;
        }

        if (message.type === "join") {
            const room = message.room;

            if (!room) {
                ws.send(JSON.stringify({
                    type: "error",
                    message: "Room is required"
                }));
                return;
            }

            ws.room = room;
            ws.role = message.role;

            if (!clients.has(room)) {
                clients.set(room, new Set());
            }

            const roomClients = clients.get(room);
            roomClients.add(ws);

            console.log(
                `JOIN room=${room} role=${ws.role} clients=${roomClients.size}`
            );

            ws.send(JSON.stringify({
                type: "joined",
                room: room,
                role: ws.role
            }));

            for (const client of roomClients) {
                if (client !== ws && client.readyState === WebSocket.OPEN) {
                    client.send(JSON.stringify({
                        type: "peer_joined",
                        role: ws.role
                    }));
                }
            }

            return;
        }

        if (!ws.room) {
            return;
        }

        const roomClients = clients.get(ws.room);

        if (!roomClients) {
            return;
        }

        for (const client of roomClients) {
            if (client !== ws && client.readyState === WebSocket.OPEN) {
                client.send(raw.toString());
            }
        }
    });

    ws.on("close", () => {
        if (!ws.room) {
            return;
        }

        const roomClients = clients.get(ws.room);

        if (!roomClients) {
            return;
        }

        roomClients.delete(ws);

        console.log(
            `LEAVE room=${ws.room} remaining=${roomClients.size}`
        );

        for (const client of roomClients) {
            if (client.readyState === WebSocket.OPEN) {
                client.send(JSON.stringify({
                    type: "peer_left"
                }));
            }
        }

        if (roomClients.size === 0) {
            clients.delete(ws.room);
        }
    });

    ws.on("error", (error) => {
        console.error("WebSocket error:", error.message);
    });
});

server.listen(PORT, "0.0.0.0", () => {
    console.log(
        `CloudScreen signaling server listening on port ${PORT}`
    );
});
