import express from "express"
import { createServer } from "http"
import { Server, Socket } from "socket.io"
import { appendLog } from "./append-log"
import { P2PCommunication } from "./intefaces"

// Check if the env vars exist
if (process.env.API_KEY == "" || process.env.LOG_FILE == "") {
	console.log("No API_KEY or LOG_FILE found")
	process.exit()
}

// Update log to say the server is starting
appendLog({
	server: "booting",
	date: new Date().toJSON(),
})

const app = express()

// Provide access to the log files
if (process.env.ACCESS_LOGS == "true") {
	app.use("/logs", express.static(`${__dirname}/../logs`))
}

// Add socket-io to the server
const httpServer = createServer(app)
const io = new Server(httpServer, {
	path: "/socket",
	maxHttpBufferSize: 1e8, // 100MB
})

// The address book for the sockets
const socketBook: {
	[Key: string]: Socket
} = {}

// Set up API KEY authorisation
io.use((socket, next) => {
	const token = socket.handshake.auth.token
	if (token != process.env.API_KEY) {
		const err = new Error("Not authorised")
		next(err)
	}
	next()
})

io.on("connection", (socket) => {
	console.log(`connection: ${socket.id}`)
	appendLog({
		server: `connection: ${socket.id}`,
		date: new Date().toJSON(),
	})

	// Add socket to the address book
	socketBook[socket.id] = socket

	socket.on("disconnect", () => {
		console.log(`disconnect: ${socket.id}`)
		appendLog({
			server: `disconnect: ${socket.id}`,
			date: new Date().toJSON(),
		})

		delete socketBook[socket.id]
	})

	socket.on("join-the-machine-room", () => {
		console.log(`join:MachineRoom: ${socket.id}`)
		appendLog({
			server: `join:MachineRoom: ${socket.id}`,
			date: new Date().toJSON(),
		})
		socket.join("MachineRoom")
	})

	// Pass-through communications
	socket.on("p2p-comm", (data: P2PCommunication) => {
		console.log(`Server Pass-Through`)
		//console.log(data.header)
		if (data.header && data.header.toId) {
			appendLog(data)
			// Check if the key is in the socketBook
			if (data.header.toId in socketBook) {
				socketBook[data.header.toId].emit("p2p-comm", data)
			} else {
				// [TODO] return an error
			}
		} else {
			console.log("Malformed data")
		}
	})
})

httpServer.listen(3000)
console.log(`Serving on http://localhost:3000`)
