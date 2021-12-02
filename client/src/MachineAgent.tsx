import { Button, Card, Divider, Form, Input, notification, Space, Tag } from "antd"
import React, { FC, useRef, useState } from "react"
import { io, Socket } from "socket.io-client"
import { P2PCommunication } from "./interfaces"
import { UltimakerClient } from "ultimaker-client"
import { useInterval } from "./helpers/use-interval"

export const MachineAgent: FC = () => {

	// Agent vars
	const [agentID, setAgentID] = useState<string>("")
	const [agentStatus, setAgentStatus] = useState<string>("disconnected")
	const socket = useRef<Socket | null>(null)

	// Machine vars
	const [machineStatus, setMachineStatus] = useState<string>("disconnected")
	const machineStatusRef = useRef<string>("")
	const ultimakerClient = useRef<UltimakerClient | null>(null)

	const [intervalDelay, setIntervalDelay] = useState<number | null>(null)

	useInterval(() => {
		if (ultimakerClient.current) {
			checkMachineStatus()
		}
	},
		intervalDelay
	)

	const checkMachineStatus = async () => {
		try {
			const status = await ultimakerClient.current.getPrinterStatus()
			console.log(`Machine Status: ${status}`)
			setMachineStatus(status)
			machineStatusRef.current = status
		} catch (err) { 
			// TODO: handle error
			console.log(err) 
		} 
	}

	const joinNetwork = (form: { ip: string; key: string }) => {
		console.log("Joining Network")
		// Will need to add checks
		ultimakerClient.current = new UltimakerClient(form.ip)
		checkMachineStatus()
		setIntervalDelay(5000)

		const s = io({
			auth: {
				token: form.key,
			},
			path: "/socket",
		})

		s.on("connect", () => {
			s.emit("join-the-machine-room")
			setAgentID(s.id)
			setAgentStatus("connected")
		})

		s.on("connect_error", (err) => {
			console.log(err instanceof Error) // true
			console.log(err.message) // not authorised
			notification["warning"]({
				message: "Connection Error",
				description: "Do you have the right key?",
			})
		})

		s.on("p2p-comm", handleCommunication)

		socket.current = s

	}

	const handleCommunication = (data: P2PCommunication) => {
		console.log("Printer Received Data")
		console.log(data)

		if (data.body.type == "status") {
			respondWithStatus(data)
			return
		}

		if (data.body.type == "submit-job" && data.body.gcode) {
			if (machineStatusRef.current == "idle") {
				respondWithJobAccepted(data)
				return
			}
			respondWithBusy(data)
			return
		}
	}

	const respondWithStatus = (data: P2PCommunication) => {
		console.log(`Send Status: ${machineStatusRef.current}`)
		const response: P2PCommunication = {
			header: {
				commId: data.header.commId,
				increment: data.header.increment+1,
				fromId: data.header.toId,
				toId: data.header.fromId,
				date: new Date().toJSON(),
			},
			body: {
				type: "status",
				response: machineStatusRef.current,
			},
		}
		socket.current.emit("p2p-comm", response)
	}

	const respondWithJobAccepted = (data: P2PCommunication) => {
		console.log(`Send Status: ${machineStatusRef.current}`)
		try {
			const res = ultimakerClient.current.postJob("test", data.body.gcode)
			const response: P2PCommunication = {
				header: {
					commId: data.header.commId,
					increment: data.header.increment+1,
					fromId: data.header.toId,
					toId: data.header.fromId,
					date: new Date().toJSON(),
				},
				body: {
					type: "submit-job",
					response: "accepted",
				},
			}
			socket.current.emit("p2p-comm", response)
		} catch (err) {
			console.log(err)
			const response: P2PCommunication = {
				header: {
					commId: data.header.commId,
					increment: data.header.increment+1,
					fromId: data.header.toId,
					toId: data.header.fromId,
					date: new Date().toJSON(),
				},
				body: {
					type: "submit-job",
					response: "Tried to accept but failed",
				},
			}
			socket.current.emit("p2p-comm", response)
		}
		const response: P2PCommunication = {
			header: {
				commId: data.header.commId,
				increment: data.header.increment+1,
				fromId: data.header.toId,
				toId: data.header.fromId,
				date: new Date().toJSON(),
			},
			body: {
				type: "submit-job",
				response: "accepted",
			},
		}
		socket.current.emit("p2p-comm", response)

	}

	const respondWithBusy = (data: P2PCommunication) => {
		console.log(`Send Status: ${machineStatusRef.current}`)
		const response: P2PCommunication = {
			header: {
				commId: data.header.commId,
				increment: data.header.increment+1,
				fromId: data.header.toId,
				toId: data.header.fromId,
				date: new Date().toJSON(),
			},
			body: {
				type: "submit-job",
				response: "busy",
			},
		}
		socket.current.emit("p2p-comm", response)
	}

	const disconnect = () => {
		if (socket) {
			socket.current.disconnect()
			setMachineStatus("disconnected")
			setAgentStatus("disconnected")
			setAgentID("")
			socket.current = null
		}
	}

	return (
		<Card
			title="Machine Peer"
			style={{ width: "100%" }}
			extra={(
				<Space>
					<Tag color="magenta">{agentID}</Tag>
					<Tag color="volcano">{agentStatus}</Tag>
					<Tag color="blue">{machineStatus}</Tag>
				</Space>
			)}
		>
			<Form onFinish={joinNetwork}>
				<Form.Item name="ip">
					<Input placeholder="Ultimkaer Printer IP Address (000.000.000.000)" />
				</Form.Item>
				<Form.Item name="key">
					<Input placeholder="Peer Key" />
				</Form.Item>
				<Form.Item>
					<Button type="primary" htmlType="submit">
						Join Network
					</Button>
				</Form.Item>
			</Form>
			<Divider />
			<Button type="default" onClick={disconnect}>
				Disconnect
			</Button>
		</Card>
	)
}
