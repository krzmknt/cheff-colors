import express, { Express, Request, Response } from 'express'
import winston from 'winston'

import { imageSearch, getDominantColorFromImageURL } from './ImageProcessor'
import { Color } from './Color'

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [new winston.transports.Console()],
})

const app: Express = express()
const port = process.env.PORT || 3000

app.get('/', (req: Request, res: Response) => {
  logger.info('request received')

  const result = {
    statusCode: 200,
    body: {
      message: 'Hello from Express and TypeScript!',
    },
  }

  res.send(result)
})

// ==============================================
// Word 2 Color
// ----------------------------------------------
app.get('/w2c', async (req: Request, res: Response) => {
  try {
    const imageUrls = await imageSearch({
      query: req.query.q as string,
      size: 'Small',
      numberOfImagesToFetch: 2,
    })
    logger.info({ image_urls: imageUrls })

    const color: Color = await getDominantColorFromImageURL(imageUrls[0].url)

    const html = `
      <html>
        <head><title>Color Page</title></head>
        <body style="background-color: ${color.hex()};">
          <h1>Your background color is: ${color.hex()}</h1>
        </body>
      </html>`

    res.send(html)
  } catch (error) {
    logger.error(error)
    res.send('Internal Server Error')
  }
})

app.listen(port, () => {
  logger.info(`http://localhost:${port}`)
  logger.info(`Example app listening on port ${port}`)
})
