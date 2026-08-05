import { app } from './app.js'
import { env } from './config/env.js'

const listenHost = env.host === '0.0.0.0' ? '10.22.0.151' : env.host

app.listen(env.port, env.host, () => {
  console.log(`Hostel Complaints API listening on http://${listenHost}:${env.port}`)
})
