import axios from 'axios'
import kmeans from 'node-kmeans'
import sharp from 'sharp'
import winston from 'winston'
// import cv from 'opencv4nodejs'

import { Color } from './Color'
import { bingImageSearch } from './bingImageSearch'
import { googleImageSearch } from './googleImageSearch'

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [new winston.transports.Console()],
})

// ==============================================
// TYPE & INTERFACE
// ==============================================

type ImageSizeToSearch = 'All' | 'Small' | 'Medium' | 'Large' | 'Wallpaper'

// 具体的な画像検索関数の引数は、このインターフェースを満たす
interface ImageSearchOptions {
  query: string
  size: ImageSizeToSearch
  numberOfImagesToFetch: number
}

// 具体的な画像検索関数の戻り値は、このインターフェースを満たす
interface ImageSearchResult {
  url: string
}

// 具体的な画像検索関数はこのインターフェースを満たす
export interface IImageSearch {
  (options: ImageSearchOptions): Promise<ImageSearchResult[]>
}

// ==============================================
// FUNCTION
// ==============================================

// ==============================================
// Image Search
// ----------------------------------------------

/**
 * An image search function that will try multiple search APIs, falling back
 * to another in case of failure.
 * @param options - Search options to be provided to the image search functions.
 * @returns A promise that resolves to an array of search results.
 * @throws An error if all the image search functions fail.
 */

export const imageSearch: IImageSearch = async (options) => {
  // Prepare multiple alternative image search APIs in case one suddenly becomes unavailable
  // const imageSearchFunctions: IImageSearch[] = [bingImageSearch, googleImageSearch]
  const imageSearchFunctions: IImageSearch[] = [bingImageSearch]

  // Generate a uniform random offset to randomly pick the first API to use.
  // This is to reduce the possibility of hitting the usage limit of a fixed API.
  const uniformRandomOffset: number = Math.floor(
    Math.random() * imageSearchFunctions.length,
  )

  // Retry with different image search APIs until successful, then throw an error if all fail.
  // As this is a fallback for specific server-side errors of the API, there's no retry interval.
  // Fallback for temporary network errors, etc., on the server side of this API is handled outside this process.
  for (let retryCount = 0; retryCount < imageSearchFunctions.length; retryCount++) {
    const index = (uniformRandomOffset + retryCount) % imageSearchFunctions.length
    try {
      logger.info(`Trying image search function ${index}...`)
      return await imageSearchFunctions[index](options)
    } catch (error) {
      logger.error(error)
      if (retryCount === imageSearchFunctions.length - 1) {
        throw new Error('All functions failed')
      }
    }
  }

  return []
}

// ==============================================
// Fetch Image
// ----------------------------------------------

/**
 * Fetches the image from the provided URL and returns it as a buffer.
 * @param {string} imageUrl - URL of the image.
 * @returns {Promise<Buffer>} The fetched image as a buffer.
 */

const fetchImage = async (imageUrl: string): Promise<ArrayBuffer> => {
  const response = await axios.get<ArrayBuffer>(imageUrl, { responseType: 'arraybuffer' })
  return response.data
}

// ==============================================
// Extract Pixel Array
// ----------------------------------------------

/**
 * Extracts the pixel data from an image buffer.
 * @param {Buffer} imageBuffer - Image as a buffer.
 * @returns {Promise<number[][]>} The pixel data.
 */

const extractPixelArray = async (imageBuffer: ArrayBuffer): Promise<number[][]> => {
  // 生のピクセルデータを取得
  const { data } = await sharp(imageBuffer).raw().toBuffer({ resolveWithObject: true })

  // 連続した3つの要素を1つのピクセルとして扱い, 1次元配列を ピクセル列に変換
  const pixels: number[][] = []
  for (let i = 0; i < data.length; i += 3) {
    const r = data[i]
    const g = data[i + 1]
    const b = data[i + 2]
    pixels.push([r, g, b])
  }
  return pixels
}

// ==============================================
// Calculate Dominant Color
// ----------------------------------------------

/**
 * Calculates the dominant color using kmeans clustering.
 * @param {number[][]} pixels - Pixel data.
 * @returns {Promise<Color>} The calculated dominant color.
 * @throws Throws an error if clustering fails.
 */

const calculateDominantColor = (pixels: number[][]): Promise<Color> => {
  return new Promise((resolve, reject) => {
    kmeans.clusterize(pixels, { k: 5 }, (err, result) => {
      if (err || !result) {
        reject(err || new Error('Clustering failed.'))
      } else {
        const centroid = result.sort((a, b) => b.cluster.length - a.cluster.length)[0]
          .centroid as [number, number, number]
        resolve(new Color(centroid[0], centroid[1], centroid[2]))
      }
    })
  })
}

// const calculateDominantColorLab = async (imageBuffer: ArrayBuffer): Promise<Color> => {
//   try {
//     const { data, info } = await sharp(imageBuffer)
//       .raw()
//       .toBuffer({ resolveWithObject: true })
//     const mat = new cv.Mat(data, info.height, info.width, cv.CV_8UC3)
//     const labMat = mat.cvtColor(cv.COLOR_RGB2Lab)
//
//     const saliency = new cv.StaticSaliencyFineGrained()
//     const { saliencyMap } = saliency.computeSaliency(labMat)
//     const mask = saliencyMap.threasdhold(0.5, 1, cv.THRESH_BINARY)
//     const maskedImage = labMat.bitwiseAnd(mask)
//
//     const [L, A, B] = cv.mean(maskedImage).slice(0, 3)
//     const [R, G, Bl] = colorConvert.lab.rgb(L, A, B)
//     const hex = colorConvert.rgb.hex([R, G, Bl])
//
//     return hex
//   } catch (error) {
//     console.error(error)
//     throw new Error('Failed to calculate dominant color.')
//   }
// }

// ==============================================
// Get Dominant Color from Image URL
// ----------------------------------------------

/**
 * Asynchronously calculates the dominant color from the specified image URL.
 * @param {string} imageUrl - URL of the image to calculate the dominant color.
 * @returns {Promise<Color>} The calculated dominant color.
 * @throws Throws an error if clustering fails.
 */

export const getDominantColorFromImageURL = async (imageUrl: string): Promise<Color> => {
  const imageBuffer = await fetchImage(imageUrl)
  const pixels = await extractPixelArray(imageBuffer)
  return calculateDominantColor(pixels)
  // return calculateDominantColorLab(imageBuffer)
}
