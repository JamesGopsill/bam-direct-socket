export interface P2PCommunication {
	header: {
		fromId: string
		toId: string
		date: string
		commId: string
		increment: number
	}
	body: any
}
