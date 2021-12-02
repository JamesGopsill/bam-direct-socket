import { Col, PageHeader, Row, Tabs } from "antd"
import React, { FC } from "react"
import "./App.css"
import { MachineAgent } from "./MachineAgent"
import { SubmissionAgent } from "./SubmissionAgent"

const { TabPane } = Tabs

const App: FC = () => {
	return (
		<React.Fragment>
			<PageHeader title="Peer 2 Peer (via sockets) Demonstration" />
			<Tabs defaultActiveKey="1" style={{ paddingLeft: 25, paddingRight: 25 }}>
				<TabPane tab="Manage Printer" key="1">
					<Row justify="space-around">
						<Col span={20}>
							<MachineAgent />
						</Col>
					</Row>
				</TabPane>
				<TabPane tab="Submit Job" key="2">
					<Row justify="space-around">
						<Col span={20}>
							<SubmissionAgent />
						</Col>
					</Row>
				</TabPane>
				<TabPane tab="Dev" key="3">
					<Row justify="space-around">
						<Col span={11}>
							<MachineAgent />
						</Col>
						<Col span={11}>
							<SubmissionAgent />
						</Col>
					</Row>
				</TabPane>
			</Tabs>
		</React.Fragment>
	)
}

export default App
