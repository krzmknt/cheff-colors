import express, { Request, Response } from 'express'

const app = express()
const port = 3000

app.get('/', (req: Request, res: Response) => {
  console.log('request received')
  const result = {
    statusCode: 200,
    body: {
      message: 'Hello from Express and TypeScript!',
    },
  }
  res.send(result)
})

app.listen(port, () => {
  console.log(`http://localhost:${port}`)
  console.log(`Example app listening on port ${port}`)
})
