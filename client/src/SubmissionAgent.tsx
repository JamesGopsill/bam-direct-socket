import { Button, Card, Form, Input, notification, Select, Upload, Space, Tag } from "antd"
import React, { FC, useState } from "react"
import { io } from "socket.io-client"
import { v4 as uuidv4 } from "uuid"
import { P2PCommunication } from "./interfaces"

const { Option } = Select

export const SubmissionAgent: FC = () => {

	const [agentID, setAgentID] = useState<string>("")
	const [agentStatus, setAgentStatus] = useState<string>("disconnected")

	const [fileList, setFileList] = useState<any[]>([])

	const onFinish = (form: { id: string; key: string; operation: string }) => {
		console.log("Update")

		if (!form.id && !form.key) {
			notification["error"]({
				message: "Missing Details",
			})
		}

		const socket = io({
			auth: {
				token: form.key,
			},
			path: "/socket",
		})

		socket.on("connect", async () => {
			setAgentID(socket.id)
			setAgentStatus("connected")

			// Send the command
			if (form.operation == "status") {
				console.log("Initiating a status-request communication")
				const comm: P2PCommunication = {
					header: {
						commId: uuidv4(),
						increment: 0,
						fromId: socket.id,
						toId: form.id,
						date: new Date().toJSON(),
					},
					body: {
						type: "status",
					},
				}
				socket.emit("p2p-comm", comm)
			}

			if (form.operation == "job" && fileList[0]) {
				console.log("Sending a job request.")
				const comm: P2PCommunication = {
					header: {
						commId: uuidv4(),
						increment: 0,
						fromId: socket.id,
						toId: form.id,
						date: new Date().toJSON(),
					},
					body: {
						type: "submit-job",
						gcode: await fileList[0].text(),
					},
				}
				socket.emit("p2p-comm", comm)
			}
		})

		socket.on("connect_error", (err) => {
			console.log(err instanceof Error) // true
			console.log(err.message) // not authorised
		})

		socket.on("p2p-comm", (data) => {
			console.log(data)
			notification["info"]({
				message: data.header.fromId,
				description: data.body.response,
			})
			socket.disconnect()
			setAgentID("")
			setAgentStatus("disconnected")
		})
	}

	const beforeUpload = (file: any) => {
		// Add the file to the file list
		setFileList([file])
		return false
	}

	const onRemove = (file: any) => {
		setFileList((fL) => {
			const index = fL.indexOf(file)
			const nFL = fL.slice()
			nFL.splice(index, 1)
			return nFL
		})
	}

	return (
		<Card
			title="Submission Peer"
			style={{ width: "100%" }}
			extra={(
				<Space>
					<Tag color="magenta">{agentID}</Tag>
					<Tag color="volcano">{agentStatus}</Tag>
				</Space>
			)}
		>
			<Form name="basic" onFinish={onFinish}>
				<Form.Item name="id">
					<Input placeholder="Printer ID" />
				</Form.Item>
				<Form.Item name="key" initialValue="BAM2021">
					<Input placeholder="Peer Key" />
				</Form.Item>
				<Form.Item name="operation" initialValue="status">
					<Select>
						<Option value="status">Get Status</Option>
						<Option value="job">Print Job</Option>
					</Select>
				</Form.Item>
				<Form.Item>
					<Upload
						beforeUpload={beforeUpload}
						onRemove={onRemove}
						fileList={fileList}
					>
						<Button>Upload</Button>
					</Upload>
				</Form.Item>
				<Form.Item>
					<Button type="primary" htmlType="submit">
						Submit
					</Button>
				</Form.Item>
			</Form>
		</Card>
	)
}
