import fs from "fs"

const logFileWithGCode = `${__dirname}/../logs/${process.env.LOG_FILE}.txt`
const logFileWithoutGCode = `${__dirname}/../logs/${process.env.LOG_FILE}-no-gcode.txt`

export const appendLog = (logEntry: any) => {
	if (process.env.LOG == "true") {
		fs.appendFile(logFileWithGCode, JSON.stringify(logEntry) + "\n", (err) => {
			if (err) console.log(err)
		})
		if (logEntry.body && logEntry.body.gcode) {
			const entry = {
				header: logEntry.header,
				body: {
					type: logEntry.body.type,
					gcode: "",
				},
			}
			fs.appendFile(
				logFileWithoutGCode,
				JSON.stringify(entry) + "\n",
				(err) => {
					if (err) console.log(err)
				}
			)
		} else {
			fs.appendFile(
				logFileWithoutGCode,
				JSON.stringify(logEntry) + "\n",
				(err) => {
					if (err) console.log(err)
				}
			)
		}
	}
}
