require("dotenv").config();
const app = require("./App");
const { createServer } = require('node:http')
const server = createServer(app)



server.listen(process.env.PORT, () => {
    console.log(`Node Server running at ${process.env.PORT}`)
})